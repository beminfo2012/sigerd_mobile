export const parseCSV = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (event) => {
            const text = event.target.result
            const lines = text.split('\n')

            // Assuming first line is header, but for this specific EDP report, 
            // we might need to be careful. Let's assume standard CSV for now.
            // Adjust based on actual CSV content if headers are weird.
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

            const results = []

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim()
                if (!line) continue

                const currentline = line.split(',')

                // Simple parser, doesn't handle commas inside quotes well. 
                // Sufficient for numeric/simple text data usually found in these reports.

                const obj = {}
                for (let j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j] ? currentline[j].replace(/"/g, '').trim() : ''
                }

                // Generate a unique ID if not present
                obj.id = obj.id || `inst_${i}`
                results.push(obj)
            }
            resolve(results)
        }

        reader.onerror = (error) => reject(error)
        reader.readAsText(file)
    })
}
