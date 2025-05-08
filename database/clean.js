const fs = require('node:fs/promises');

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
            if(anime.year < 2015){
                return false;
            }
            if(anime.episodes === 1){
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
            if (anime.members < 25000) {
                return false;
            }
            // Rule 3a: Ecchi/Erotica with score < 5.5
            if (isEcchiOrErotica && anime.score < 5.5) {
                return false;
            }

            // Rule 3b: Not Ecchi/Erotica with score < 6.0
            if (!isEcchiOrErotica && anime.score < 6.0) {
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

        const outputFilePath = 'cleaned_input.json';
        await fs.writeFile(outputFilePath, JSON.stringify(outputData, null, 2), 'utf8');

        console.log(`Successfully cleaned the database. The cleaned data has been written to ${outputFilePath}`);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

const inputFilePath = 'input.json';
cleanAnimeDatabase(inputFilePath);