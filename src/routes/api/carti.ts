import { createServerFileRoute } from '@tanstack/react-start/server'

type RawBookRow = {
  autor: string
  titlu: string
  locAparitie: string
  anulAparitiei: string
  disponibil: string
}

type GroupedBook = {
  autor: string
  titlu: string
  locAparitie: string
  anulAparitiei: string
  totalExemplare: number
  exemplareDisponibile: number
  esteDisponibila: boolean
  mesaj: string
}

function normalize(text: string) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function parseCsvLine(line: string) {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result.map((x) => x.trim())
}

function parseCsv(csv: string): RawBookRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((h) => normalize(h))

  const idxAutor = headers.findIndex((h) => h === 'autor')
  const idxTitlu = headers.findIndex((h) => h === 'titlu')
  const idxLoc = headers.findIndex(
    (h) => h === 'loc aparitie' || h === 'locaparitie'
  )
  const idxAn = headers.findIndex(
    (h) => h === 'anul aparitiei' || h === 'anulaparitiei'
  )
  const idxDisponibil = headers.findIndex(
    (h) => h === 'disponibil' || h === 'disponibila'
  )

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line)

    return {
      autor: cols[idxAutor] || '',
      titlu: cols[idxTitlu] || '',
      locAparitie: cols[idxLoc] || '',
      anulAparitiei: cols[idxAn] || '',
      disponibil: cols[idxDisponibil] || '',
    }
  })
}

function matchesBook(row: RawBookRow, query: string, mode: string) {
  const q = normalize(query)
  if (!q) return true

  const autor = normalize(row.autor)
  const titlu = normalize(row.titlu)
  const loc = normalize(row.locAparitie)
  const an = normalize(row.anulAparitiei)

  if (mode === 'titlu') return titlu.includes(q)
  if (mode === 'autor') return autor.includes(q)

  return `${autor} ${titlu} ${loc} ${an}`.includes(q)
}

function buildKey(row: RawBookRow) {
  return [
    normalize(row.autor),
    normalize(row.titlu),
    normalize(row.locAparitie),
    normalize(row.anulAparitiei),
  ].join('||')
}

function isAvailable(value: string) {
  const v = normalize(value)
  return v === 'da' || v === 'disponibil' || v === 'yes'
}

export const ServerRoute = createServerFileRoute('/api/carti').methods({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') ?? ''
    const mode = url.searchParams.get('mode') ?? 'toate'

    const sheetId = '1kR_JmRBLqpxTMZEe5_B9JASp5UY0Cs5Uu2YVNd9XZiQ'
    const gid = '0'

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
    const response = await fetch(csvUrl, { cache: 'no-store' })

    if (!response.ok) {
      return Response.json(
        { error: 'Nu am putut citi catalogul din Google Sheets.' },
        { status: 500 }
      )
    }

    const csv = await response.text()
    const rows = parseCsv(csv).filter((row) => matchesBook(row, q, mode))

    const grouped = new Map<string, GroupedBook>()

    for (const row of rows) {
      const key = buildKey(row)

      if (!grouped.has(key)) {
        grouped.set(key, {
          autor: row.autor,
          titlu: row.titlu,
          locAparitie: row.locAparitie,
          anulAparitiei: row.anulAparitiei,
          totalExemplare: 0,
          exemplareDisponibile: 0,
          esteDisponibila: false,
          mesaj: '',
        })
      }

      const book = grouped.get(key)!
      book.totalExemplare += 1

      if (isAvailable(row.disponibil)) {
        book.exemplareDisponibile += 1
      }
    }

    const results = Array.from(grouped.values())
      .map((book) => {
        const esteDisponibila = book.exemplareDisponibile > 0

        return {
          ...book,
          esteDisponibila,
          mesaj: esteDisponibila
            ? 'Poți împrumuta cartea în zilele de luni, marți, miercuri, joi și vineri între orele 09:00 - 17:00.'
            : 'Cartea există în catalog, dar nu este disponibilă momentan pentru împrumut.',
        }
      })
      .slice(0, 50)

    return Response.json({ results })
  },
})
