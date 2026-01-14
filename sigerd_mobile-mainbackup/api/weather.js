export default async function handler(request, response) {
    const lat = -20.0246;
    const lon = -40.7464;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo`;

    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) {
            throw new Error(`Weather API failed: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();

        const result = {
            current: {
                temp: data.current.temperature_2m,
                humidity: data.current.relative_humidity_2m,
                rain: data.current.precipitation,
                wind: data.current.wind_speed_10m,
                code: data.current.weather_code
            },
            daily: data.daily.time.map((t, i) => ({
                date: t,
                tempMax: data.daily.temperature_2m_max[i],
                tempMin: data.daily.temperature_2m_min[i],
                rainProb: data.daily.precipitation_probability_max[i],
                code: data.daily.weather_code[i]
            }))
        };

        // Enable CORS
        response.setHeader('Access-Control-Allow-Credentials', true)
        response.setHeader('Access-Control-Allow-Origin', '*')
        response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        response.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        )

        response.status(200).json(result);

    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Failed to fetch weather data', details: error.message });
    }
}
