const fs = require('node:fs/promises');

// Configuration
const outputFilePath = 'cleaned_NEW.json';

async function cleanAnimeDatabase(inputFilePath) {
    try {
        const data = await fs.readFile(inputFilePath, 'utf8');
        const animeList = JSON.parse(data).animeList;

        const cleanedList = animeList.filter(anime => {
            const isEcchiOrErotica = anime.genres.includes("Ecchi") || anime.genres.includes("Erotica");
            // Rule 0: Remove Hentai
            if (anime.genres.includes("Hentai")) {
                return false;
            }

            // Rule 3: Include all Ecchi and Erotica (no need to remove)
            if (isEcchiOrErotica) {
                return true;
            }

            // Rule 4: Apply member-based score calculation
            const members = anime.members;

            // If members are over 200k, include
            if (members >= 200000) {
                return true;
            }

            let requiredScore;

            // Determine required score based on members
            if (members < 10000) {
                requiredScore = 7.75;
            } else {
                const refPoints = [
                    { m: 10000, s: 7.75 },
                    { m: 25000, s: 7.25 },
                    { m: 50000, s: 6.75 },
                    { m: 100000, s: 6.25 },
                    { m: 200000, s: 5.75 }
                ];
                let lower, upper;
                for (let i = 0; i < refPoints.length - 1; i++) {
                    const current = refPoints[i];
                    const next = refPoints[i + 1];
                    if (members >= current.m && members < next.m) {
                        lower = current;
                        upper = next;
                        break;
                    }
                }
                // Calculate the linear interpolation
                const slope = (upper.s - lower.s) / (upper.m - lower.m);
                requiredScore = lower.s + (members - lower.m) * slope;
            }

            // Check if the anime's score meets the required score
            return anime.score >= requiredScore;
        });

        console.log(`Total of ${cleanedList.length} entries.`);

        const outputData = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            animeList: cleanedList
        };

        await fs.writeFile(outputFilePath, JSON.stringify(outputData, null, 2), 'utf8');

        console.log(`Successfully cleaned the database. The cleaned data has been written to ${outputFilePath}`);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

const inputFilePath = 'input.json';
cleanAnimeDatabase(inputFilePath);