// Clean v2 rules are the following:
// Rule 0: Remove Hentai
// Rule 1: More than 50k members special rules
// Rule 2: Remove less than 25k members
// Rule 3a: Ecchi/Erotica with score < 5.5
// Rule 3b: Not Ecchi/Erotica with score < 6.0
// Rule 4: Remove if year is before 2005 (DEFAULT, THERE'S NO ANIME BEFORE 2005 IN THE DATABASE)

const fs = require('node:fs/promises');

// Configuration
const yearMin = 2005;
const yearMax = 2025;
const globalScore = 6;
const ecchiGlobalScore = 5.5;
const minimumMembers = 25000;

async function cleanAnimeDatabase(inputFilePath) {
    try {
        const data = await fs.readFile(inputFilePath, 'utf8');
        const animeList = JSON.parse(data).animeList;

        const cleanedList = animeList.filter(anime => {
            
            const isEcchiOrErotica = anime.genres.includes("Ecchi") || anime.genres.includes("Erotica");
            // Rule 0a: Remove Hentai
            if (anime.genres.includes("Hentai")) {
                return false;
            }
            // Rule 0b: Remove if year X
            if(yearMin && yearMax && (anime.year < yearMin || anime.year > yearMax)){
                return false;
            }
            // Rule 1: More than 50k members special rules
            if(anime.members > 50000 && anime.score > 5.5){
                return true;
            }
            if(isEcchiOrErotica && anime.members > 50000 && anime.score > 5){
                return true;
            }

            // Rule 2: Remove less than 25k viewers
            if (anime.members < minimumMembers) {
                return false;
            }
            // Rule 3a: Ecchi/Erotica with score < 5.5
            if (isEcchiOrErotica && anime.score < ecchiGlobalScore) {
                return false;
            }

            // Rule 3b: Not Ecchi/Erotica with score < 6.0
            if (!isEcchiOrErotica && anime.score < globalScore) {
                return false;
            }

            // If none of the removal conditions are met, keep the anime
            return true;
        });

        console.log(`Total of ${cleanedList.length} entries.`);

        const outputData = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            animeList: cleanedList
        };

        const outputFilePath = 'cleaned_v2.json';
        await fs.writeFile(outputFilePath, JSON.stringify(outputData, null, 2), 'utf8');

        console.log(`Successfully cleaned the database. The cleaned data has been written to ${outputFilePath}`);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

const inputFilePath = 'input.json';
cleanAnimeDatabase(inputFilePath);