document.addEventListener('DOMContentLoaded', () => {
    // --- Global Tooltip Element ---
    let globalTooltip = null; // Will be created once
    function createGlobalTooltip() {
        if (!globalTooltip) {
            globalTooltip = document.createElement('div');
            globalTooltip.id = 'globalAnimeTooltip';
            // Base styles will be in CSS, initially hidden
            document.body.appendChild(globalTooltip);
        }
    }
    createGlobalTooltip(); // Create it on DOM ready

    let currentOpenAnimeLink = null; // Track which link opened the tooltip

    // --- Element References ---
    const inputModeBtn = document.getElementById('inputModeBtn');
    const searchModeBtn = document.getElementById('searchModeBtn');
    const hideModeBtn = document.getElementById('hideModeBtn');
    const inputModeSection = document.getElementById('inputModeSection');
    const searchModeSection = document.getElementById('searchModeSection');
    const animeInputList = document.getElementById('animeInputList');
    const processInputBtn = document.getElementById('processInputBtn');
    const inputStatus = document.getElementById('inputStatus');
    const animeSearchInput = document.getElementById('animeSearchInput');
    const searchResultsDropdown = document.getElementById('searchResultsDropdown');
    const animeTableBody = document.querySelector('#animeTable tbody');
    const animeTableHead = document.querySelector('#animeTable thead');
    const emptyListMessage = document.getElementById('emptyListMessage');
    const editModal = document.getElementById('editModal');
    const closeModal = document.querySelector('.close');
    const newAnimeId = document.getElementById('newAnimeId');
    const confirmEdit = document.getElementById('confirmEdit');
    const editStatus = document.getElementById('editStatus');
    const clearListBtn = document.getElementById('clearListBtn');
    const exportListBtn = document.getElementById('exportListBtn');
    const importListInput = document.getElementById('importListInput');
    const minScore = document.getElementById('minScore');
    const maxScore = document.getElementById('maxScore');
    const minMembers = document.getElementById('minMembers');
    const maxMembers = document.getElementById('maxMembers');
    const minEpisodesFilter = document.getElementById('minEpisodesFilter');
    const maxEpisodesFilter = document.getElementById('maxEpisodesFilter');
    const yearFilter = document.getElementById('yearFilter');
    const seasonFilter = document.getElementById('seasonFilter');
    const genreFilterList = document.getElementById('genreFilterList');
    const themeFilterList = document.getElementById('themeFilterList');
    const statusFilter = document.getElementById('statusFilter');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const batchModeBtn = document.getElementById('batchModeBtn');
    const batchModeSection = document.getElementById('batchModeSection');
    const batchStartSeason = document.getElementById('batchStartSeason');
    const batchStartYear = document.getElementById('batchStartYear');
    const batchEndSeason = document.getElementById('batchEndSeason');
    const batchEndYear = document.getElementById('batchEndYear');
    const batchFetchBtn = document.getElementById('batchFetchBtn');
    const batchStatus = document.getElementById('batchStatus');
    const finalPage = document.getElementById('finalPage');
    const initialPage = document.getElementById('initialPage');
    const batchMinMembersCheckbox = document.getElementById('batchMinMembersCheckbox');

    const previousYearBtn = document.getElementById('previousYearBtn');
    const nextYearBtn = document.getElementById('nextYearBtn');
    const previousSeasonBtn = document.getElementById('previousSeasonBtn');
    const nextSeasonBtn = document.getElementById('nextSeasonBtn');
    const resultsCountMessage = document.getElementById('resultsCountMessage');

    // --- Static Data ---
    const ALL_STATIC_GENRES = [
        "Action", "Adventure", "Avant Garde", "Award Winning", "Boys Love", "Comedy", "Drama",
        "Ecchi", "Erotica", "Fantasy", "Girls Love", "Gourmet", "Hentai", "Horror", "Mystery",
        "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Suspense"
    ].sort(); // Ensure alphabetical order

    const ALL_STATIC_THEMES = [
        "Adult Cast", "Anthropomorphic", "CGDCT", "Childcare", "Combat Sports", "Crossdressing",
        "Delinquents", "Detective", "Educational", "Gag Humor", "Gore", "Harem", "High Stakes Game",
        "Historical", "Idols (Female)", "Idols (Male)", "Isekai", "Iyashikei", "Love Polygon", "Love Status Quo",
        "Magical Sex Shift", "Mahou Shoujo", "Martial Arts", "Mecha", "Medical", "Military", "Music",
        "Mythology", "Organized Crime", "Otaku Culture", "Parody", "Performing Arts", "Pets",
        "Psychological", "Racing", "Reincarnation", "Reverse Harem", "Samurai", "School", "Showbiz",
        "Space", "Strategy Game", "Super Power", "Survival", "Team Sports", "Time Travel",
        "Urban Fantasy", "Vampire", "Video Game", "Villainess", "Visual Arts", "Workplace"
    ].sort();

    // --- State Variables ---
    let animeList = []; // Array to hold anime objects
    let filteredList = null;
    let selectedGenres = new Set();
    let genreFilterMode = 'inclusive'; // 'inclusive', 'all_selected', or 'none_selected'
    let selectedThemes = new Set(); // Added
    let themeFilterMode = 'inclusive'; // Added: 'inclusive', 'all_selected', or 'none_selected'
    const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';
    const INPUT_MODE_DELAY = 1500; // 1.5 seconds delay between requests in input mode
    let currentSortColumn = 'name'; // Default sort column
    let currentSortDirection = 'asc'; // Default sort direction
    let currentEditIndex = -1; // Track which anime is being edited

    // --- Local Storage ---
    const LOCAL_STORAGE_KEY = 'jikanAnimeList';

    // Function to load list from local storage
    const loadListFromLocalStorage = () => {
        const storedList = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedList) {
            try {
                animeList = JSON.parse(storedList);
                // Ensure members and score are numbers for sorting
                animeList.forEach(anime => {
                    if (typeof anime.members === 'string') {
                        // Remove commas and convert to number
                        anime.members = parseInt(anime.members.replace(/,/g, ''), 10) || 0;
                    } else if (typeof anime.members !== 'number') {
                        anime.members = 0;
                    }
                    if (typeof anime.score !== 'number') {
                        anime.score = parseFloat(anime.score) || 0;
                    }
                    if (typeof anime.year !== 'number') {
                        anime.year = parseInt(anime.year, 10) || 0;
                    }
                    if (!anime.themes) {
                        anime.themes = [];
                    }
                    if (anime.cover === undefined) {
                        anime.cover = '';
                    }
                    if (anime.synopsis === undefined) {
                        anime.synopsis = 'Synopsis not available.';
                    }
                });
                populateGenreFilter();
                populateThemeFilter();
                filteredList = [...animeList];
            } catch (e) {
                console.error("Failed to parse anime list from localStorage:", e);
                animeList = [];
                filteredList = null;
            }
        } else {
            animeList = [];
            filteredList = null;
        }
        renderAnimeList();
    };

    // Function to save list to local storage
    const saveListToLocalStorage = () => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(animeList));
    };

    // --- UI Rendering ---

    // Function to render the anime list in the table
    const renderAnimeList = () => {
        animeTableBody.innerHTML = '';
        emptyListMessage.classList.add('hidden');

        // Use filteredList if filters are active, otherwise use animeList
        const listToRender = filteredList !== null ? filteredList : animeList;
        
        console.log('Rendering list:');
        
        if (listToRender.length === 0) {
            emptyListMessage.classList.remove('hidden');
            return;
        }

        const sortedList = sortAnimeList(listToRender, currentSortColumn, currentSortDirection);

        sortedList.forEach((anime, index) => {
            const row = animeTableBody.insertRow();
            
            // # column
            const numberCell = row.insertCell(0);
            numberCell.textContent = index + 1;
            numberCell.className = 'number-column';
            
            // Name cell with link and tooltip
            const nameCell = row.insertCell(1);
            
            const nameLink = document.createElement('a');
            nameLink.href = `https://myanimelist.net/anime/${anime.mal_id}`;
            nameLink.target = '_blank';
            nameLink.className = 'anime-name-link';
            nameLink.textContent = anime.name;
            
            nameCell.appendChild(nameLink);

            // Info Window (formerly Tooltip) logic: Click to open/toggle, click outside to close
            nameLink.addEventListener('click', (event) => {
                event.preventDefault();

                if (globalTooltip.classList.contains('active') && currentOpenAnimeLink === nameLink) {
                    // Clicked the same link that opened the currently active tooltip: close it
                    globalTooltip.classList.remove('active');
                    currentOpenAnimeLink = null;
                } else {
                    // Clicked a new link or tooltip was closed: open/reopen it for this anime
                    // 1. Populate globalTooltip content
                    globalTooltip.innerHTML = `
                        <h4 class="tooltip-title">${anime.name}</h4>
                        <div class="tooltip-middle-section">
                            <img src="${anime.cover || 'placeholder.png'}" alt="${anime.name} cover" class="tooltip-cover-image">
                            <p class="tooltip-synopsis">${anime.synopsis}</p>
                        </div>
                        <div class="tooltip-stats-section">
                            ${anime.genres && anime.genres.length > 0 ? `<div class="tooltip-genres"><strong>Genres:</strong> ${anime.genres.map(g => `<span class="tooltip-genre-pill">${g}</span>`).join(' ')}</div>` : ''}
                            ${anime.themes && anime.themes.length > 0 ? `<div class="tooltip-themes"><strong>Themes:</strong> ${anime.themes.map(t => `<span class="tooltip-theme-pill">${t}</span>`).join(' ')}</div>` : ''}
                            <div class="tooltip-members-score">
                                <span class="tooltip-stat"><i class="fas fa-users"></i> ${anime.members.toLocaleString()}</span>
                                <span class="tooltip-stat"><i class="fas fa-star"></i> ${anime.score ? anime.score.toFixed(2) : 'N/A'}</span>
                            </div>
                        </div>
                        <div class="info-window-actions">
                            <a href="https://myanimelist.net/anime/${anime.mal_id}" target="_blank" rel="noopener noreferrer" class="info-action-btn mal-btn">MAL</a>
                            <a href="https://hianimez.to/search?keyword=${encodeURIComponent(anime.name)}" target="_blank" rel="noopener noreferrer" class="info-action-btn hi-btn">HiAnimez</a>
                            <a href="https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.name)}" target="_blank" rel="noopener noreferrer" class="info-action-btn cr-btn">Crunchyroll</a>
                            <a href="https://www.netflix.com/search?q=${encodeURIComponent(anime.name)}" target="_blank" rel="noopener noreferrer" class="info-action-btn nf-btn">Netflix</a>
                            <button type="button" class="info-action-btn copy-btn" data-anime-title="${anime.name}">Copy Title</button>
                        </div>
                    `;

                    // Add click listener for the new Copy Title button
                    const copyBtn = globalTooltip.querySelector('.copy-title-btn');
                    if (copyBtn) {
                        copyBtn.addEventListener('click', () => {
                            const titleToCopy = copyBtn.dataset.animeTitle;
                            navigator.clipboard.writeText(titleToCopy).then(() => {
                                // Success feedback: change button text temporarily
                                const originalText = copyBtn.textContent;
                                copyBtn.textContent = 'Copied!';
                                copyBtn.disabled = true;
                                setTimeout(() => {
                                    copyBtn.textContent = originalText;
                                    copyBtn.disabled = false;
                                }, 1500);
                            }).catch(err => {
                                console.error('Failed to copy title: ', err);
                                // Optional: User feedback for error
                                alert('Failed to copy title.');
                            });
                        });
                    }

                    // 2. Position and Show
                    // Ensure it's visible for getBoundingClientRect to work correctly if it was hidden
                    globalTooltip.classList.add('active'); 
                    // We might need a brief moment for content to render and affect size
                    // requestAnimationFrame can help ensure dimensions are read after render
                    requestAnimationFrame(() => {
                        const linkRect = nameLink.getBoundingClientRect();
                        const tooltipRect = globalTooltip.getBoundingClientRect(); // Get its dimensions AFTER content is set & it's active
                        const viewportWidth = window.innerWidth;
                        const viewportHeight = window.innerHeight;
                        const scrollY = window.scrollY;
                        const scrollX = window.scrollX;

                        let top = linkRect.top + scrollY - tooltipRect.height - 10; // 10px above the link
                        let left = linkRect.left + scrollX + (linkRect.width / 2) - (tooltipRect.width / 2); // Centered

                        // Adjust for viewport boundaries
                        if (top < scrollY + 10) { 
                            top = linkRect.bottom + scrollY + 10;
                            if (top + tooltipRect.height > scrollY + viewportHeight - 10) {
                                top = scrollY + viewportHeight - tooltipRect.height - 10;
                            }
                        }
                         if (top + tooltipRect.height > scrollY + viewportHeight - 10 ) { 
                             top = scrollY + viewportHeight - tooltipRect.height - 10;
                        }
                        if (left < scrollX + 10) { 
                            left = scrollX + 10; 
                        }
                        if (left + tooltipRect.width > scrollX + viewportWidth - 10) { 
                            left = scrollX + viewportWidth - tooltipRect.width - 10; 
                        }
                        
                        globalTooltip.style.top = `${Math.max(scrollY + 10, top)}px`; // Ensure it doesn't go above viewport top due to adjustments
                        globalTooltip.style.left = `${left}px`;
                        globalTooltip.style.transform = '';
                    });
                    currentOpenAnimeLink = nameLink;
                }
            });

            // Season & Year cell
            row.insertCell(2).textContent = `${anime.season || 'N/A'} ${anime.year || 'N/A'}`;
            
            // Members cell
            row.insertCell(3).textContent = anime.members.toLocaleString();
            
            // Score cell
            row.insertCell(4).textContent = anime.score ? anime.score.toFixed(2) : 'N/A';

            // Episodes cell
            row.insertCell(5).textContent = anime.episodes || '?';

            // Genres cell
            const genresCell = row.insertCell(6);
            const genreList = document.createElement('div');
            genreList.className = 'genre-list';
            
            if (anime.genres && anime.genres.length > 0) {
                anime.genres.forEach(genre => {
                    const genreSpan = document.createElement('span');
                    genreSpan.className = 'genre';
                    if (['Erotica', 'Ecchi', 'Hentai'].includes(genre)) {
                        genreSpan.classList.add('adult');
                    }
                    genreSpan.textContent = genre;
                    genreList.appendChild(genreSpan);
                });
            } else {
                genreList.textContent = 'N/A';
            }
            genresCell.appendChild(genreList);
            
            // Themes cell
            const themesCell = row.insertCell(7);
            const themeList = document.createElement('div');
            themeList.className = 'theme-list';
            
            if (anime.themes && anime.themes.length > 0) {
                anime.themes.forEach(theme => {
                    const themeSpan = document.createElement('span');
                    themeSpan.className = 'theme';
                    themeSpan.textContent = theme;
                    themeList.appendChild(themeSpan);
                });
            } else {
                themeList.textContent = 'N/A';
            }
            themesCell.appendChild(themeList);
            
            // Actions cell
            const actionsCell = row.insertCell(8);
            
            // Toggle Added button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = `action-btn toggle-btn ${anime.added ? 'added' : ''}`;
            toggleBtn.innerHTML = anime.added ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
            toggleBtn.title = anime.added ? 'Mark as Not Added' : 'Mark as Added';
            toggleBtn.onclick = () => toggleAnimeAdded(index);
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
            editBtn.title = 'Edit';
            editBtn.onclick = () => openEditModal(index);
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete';
            deleteBtn.onclick = () => deleteAnime(index);
            
            actionsCell.appendChild(toggleBtn);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });

        // Update results count message
        const count = listToRender.length;
        if (count === 0) {
            resultsCountMessage.textContent = 'No results to display.';
        } else if (filteredList !== null) {
            resultsCountMessage.textContent = `Displaying ${count} filtered results (out of ${animeList.length} total).`;
        } else {
            resultsCountMessage.textContent = `Displaying ${count} results.`;
        }
    };

    // Function to sort the anime list
    const SEASON_ORDER = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 };

    function capitalizeSeason(season) {
        if (!season) return '';
        return season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
    }

    const sortAnimeList = (list, column, direction) => {
        return [...list].sort((a, b) => {
            let comparison = 0;
            const aValue = a[column];
            const bValue = b[column];

            if (column === 'seasonYear') {
                // Sort by year, then by season order
                const aYear = a.year || 0;
                const bYear = b.year || 0;
                if (aYear !== bYear) {
                    comparison = aYear - bYear;
                } else {
                    const aSeason = capitalizeSeason(a.season);
                    const bSeason = capitalizeSeason(b.season);
                    comparison = (SEASON_ORDER[aSeason] ?? -1) - (SEASON_ORDER[bSeason] ?? -1);
                }
            } else if (column === 'genres') {
                // Sort by first genre name
                const aGenres = a.genres || [];
                const bGenres = b.genres || [];
                const aFirstGenre = aGenres[0] || '';
                const bFirstGenre = bGenres[0] || '';
                comparison = aFirstGenre.localeCompare(bFirstGenre);
            } else if (column === 'themes') {
                const aThemes = a.themes || [];
                const bThemes = b.themes || [];
                const aFirstTheme = aThemes[0] || '';
                const bFirstTheme = bThemes[0] || '';
                comparison = aFirstTheme.localeCompare(bFirstTheme);
            } else if (typeof aValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else {
                comparison = aValue - bValue;
            }

            return direction === 'asc' ? comparison : -comparison;
        });
    };

    // --- Modal Functions ---
    const openEditModal = (index) => {
        currentEditIndex = index;
        newAnimeId.value = '';
        editStatus.textContent = '';
        editModal.style.display = 'block';
    };

    const closeEditModal = () => {
        editModal.style.display = 'none';
        currentEditIndex = -1;
        newAnimeId.value = '';
        editStatus.textContent = '';
    };

    // --- Event Handlers for Modal ---
    closeModal.onclick = closeEditModal;
    window.onclick = (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
    };

    confirmEdit.onclick = async () => {
        const newId = parseInt(newAnimeId.value);
        if (isNaN(newId)) {
            editStatus.textContent = 'Please enter a valid MAL ID';
            return;
        }

        editStatus.textContent = 'Fetching new anime data...';
        const apiData = await fetchAnimeById(newId);
        
        if (!apiData) {
            editStatus.textContent = 'Failed to fetch anime data';
            return;
        }

        const newAnimeData = extractAnimeData(apiData);
        if (currentEditIndex >= 0 && currentEditIndex < animeList.length) {
            // Preserve the search term from the original entry
            newAnimeData.searchTerm = animeList[currentEditIndex].searchTerm;
            animeList[currentEditIndex] = newAnimeData;
            saveListToLocalStorage();
            renderAnimeList();
            closeEditModal();
        }
    };

    // --- Delete Function ---
    const deleteAnime = (index) => {
        if (confirm('Are you sure you want to delete this anime from your list?')) {
            const listCurrentlyDisplayed = filteredList !== null ? filteredList : animeList;
            const sortedDisplayedList = sortAnimeList(listCurrentlyDisplayed, currentSortColumn, currentSortDirection);
            const animeToDelete = sortedDisplayedList[index];

            if (!animeToDelete) {
                console.error("Error: Could not find the anime to delete from displayed list at index:", index);
                return;
            }

            const actualIndexInMainAnimeList = animeList.findIndex(anime => anime.mal_id === animeToDelete.mal_id);

            if (actualIndexInMainAnimeList !== -1) {
                animeList.splice(actualIndexInMainAnimeList, 1);
                saveListToLocalStorage();

                if (filteredList !== null) {
                    applyFilters();
                } else {
                    renderAnimeList();
                }
            } else {
                console.error("Error: Anime found in displayed list for deletion but not in main animeList. MAL_ID:", animeToDelete.mal_id);
            }
        }
    };

    // --- API Interaction ---

    // Function to fetch anime by ID
    const fetchAnimeById = async (id) => {
        try {
            const response = await fetch(`${JIKAN_API_BASE_URL}/anime/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Anime with ID ${id} not found.`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(`Error fetching anime by ID ${id}:`, error);
            return null;
        }
    };

    // Function to search for anime by name
    const searchAnimeByName = async (name) => {
        try {
            const encodedName = encodeURIComponent(name);
            const response = await fetch(`${JIKAN_API_BASE_URL}/anime?q=${encodedName}&limit=10`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`No results found for "${name}".`);
                    return [];
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(`Error searching for anime "${name}":`, error);
            return [];
        }
    };

    // Function to extract relevant anime data
    const extractAnimeData = (apiData) => {
        if (!apiData) return null;

        // Extract genre names and identify adult genres
        const genres = (apiData.genres || []).map(genre => genre.name);
        const adultGenres = ['Erotica', 'Ecchi', 'Hentai'];
        const hasAdultGenre = genres.some(genre => adultGenres.includes(genre));

        // Extract theme names
        const themes = (apiData.themes || []).map(theme => theme.name);

        // Extract cover image (webp, regular size)
        let coverImageUrl = '';
        if (apiData.images && apiData.images.webp && apiData.images.webp.image_url) {
            coverImageUrl = apiData.images.webp.image_url;
        }

        // Extract synopsis
        const synopsisText = apiData.synopsis || 'Synopsis not available.';

        // Convert members to number, removing commas if present
        const members = typeof apiData.members === 'string' 
            ? parseInt(apiData.members.replace(/,/g, ''), 10) || 0
            : apiData.members || 0;

        return {
            mal_id: apiData.mal_id,
            name: apiData.title || apiData.title_english || apiData.title_japanese || 'Unknown Title',
            season: apiData.season,
            year: parseInt(apiData.year, 10) || 0,
            members: members,
            score: parseFloat(apiData.score) || 0,
            episodes: apiData.episodes || 0,
            genres: genres,
            themes: themes,
            cover: coverImageUrl,
            synopsis: synopsisText,
            hasAdultGenre: hasAdultGenre,
            searchTerm: apiData.searchTerm,
            added: false
        };
    };

    // Function to toggle anime added status
    const toggleAnimeAdded = (index) => {
        const listCurrentlyDisplayed = filteredList !== null ? filteredList : animeList;
        const sortedDisplayedList = sortAnimeList(listCurrentlyDisplayed, currentSortColumn, currentSortDirection);
        const animeToToggle = sortedDisplayedList[index];

        if (!animeToToggle) {
            console.error("Error: Could not find the anime to toggle from displayed list at index:", index);
            return;
        }

        const actualIndexInMainAnimeList = animeList.findIndex(a => a.mal_id === animeToToggle.mal_id);

        if (actualIndexInMainAnimeList !== -1) {
            animeList[actualIndexInMainAnimeList].added = !animeList[actualIndexInMainAnimeList].added;
            saveListToLocalStorage();

            if (filteredList !== null) {
                applyFilters();
            } else {
                renderAnimeList();
            }
        } else {
            console.error("Error: Anime found in displayed list for toggle but not in main animeList. MAL_ID:", animeToToggle.mal_id);
        }
    };

    // Function to add anime to the list (with duplicate check)
    const addAnimeToList = (animeData, searchTerm = null) => {
        if (!animeData || !animeData.mal_id) {
            console.warn("Invalid anime data provided.");
            return false;
        }

        // Check if anime already exists by mal_id
        const existingAnime = animeList.find(anime => anime.mal_id === animeData.mal_id);

        if (!existingAnime) {
            if (searchTerm) {
                animeData.searchTerm = searchTerm;
            }
            animeList.push(animeData);
            saveListToLocalStorage();
            renderAnimeList();
            return true;
        } else {
            return {
                exists: true,
                name: existingAnime.name
            };
        }
    };

    // --- Clear List Function ---
    const clearList = () => {
        if (confirm('Are you sure you want to clear the entire list? This action cannot be undone.')) {
            animeList = [];
            saveListToLocalStorage();
            renderAnimeList();
        }
    };

    // --- Event Handlers ---

    // Mode switcher event listeners
    inputModeBtn.addEventListener('click', () => {
        inputModeSection.classList.remove('hidden');
        searchModeSection.classList.add('hidden');
        inputModeBtn.classList.add('active');
        searchModeBtn.classList.remove('active');
        batchModeSection.classList.add('hidden');
        batchModeBtn.classList.remove('active');
        searchResultsDropdown.innerHTML = '';
    });

    searchModeBtn.addEventListener('click', () => {
        searchModeSection.classList.remove('hidden');
        inputModeSection.classList.add('hidden');
        searchModeBtn.classList.add('active');
        inputModeBtn.classList.remove('active');
        batchModeSection.classList.add('hidden');
        batchModeBtn.classList.remove('active');
        inputStatus.textContent = '';
    });
    hideModeBtn.addEventListener('click', hideInputModes);

    // Input Mode: Process list button
    processInputBtn.addEventListener('click', async () => {
        const lines = animeInputList.value.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length === 0) {
            inputStatus.textContent = 'No input lines found.';
            return;
        }

        inputStatus.textContent = `Processing ${lines.length} lines...`;
        processInputBtn.disabled = true;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            inputStatus.textContent = `Processing line ${i + 1} of ${lines.length}: "${line}"`;

            let animeData = null;
            const malId = parseInt(line, 10);

            if (!isNaN(malId)) {
                const apiData = await fetchAnimeById(malId);
                if (apiData) {
                    animeData = extractAnimeData(apiData);
                    animeData.searchTerm = line;
                } else {
                    inputStatus.textContent += ` - ID not found.`;
                }
            } else {
                const searchResults = await searchAnimeByName(line);
                if (searchResults && searchResults.length > 0) {
                    const apiData = await fetchAnimeById(searchResults[0].mal_id);
                    if(apiData) {
                        animeData = extractAnimeData(apiData);
                        animeData.searchTerm = line;
                    } else {
                        inputStatus.textContent += ` - Found match "${searchResults[0].title}", but could not fetch full data.`;
                    }
                } else {
                    inputStatus.textContent += ` - No search results found.`;
                }
            }

            if (animeData) {
                const result = addAnimeToList(animeData);
                if (result === true) {
                    inputStatus.textContent += ` - Added "${animeData.name}".`;
                } else if (result.exists) {
                    inputStatus.textContent += ` - Skipped "${animeData.name}" (already exists).`;
                }
            }

            if (i < lines.length - 1) {
                await new Promise(resolve => setTimeout(resolve, INPUT_MODE_DELAY));
            }
        }

        inputStatus.textContent = `Processing complete. Added ${animeList.length - (lines.length - lines.filter(line => {
            const malId = parseInt(line, 10);
            if (!isNaN(malId)) {
                return animeList.some(anime => anime.mal_id === malId);
            }
            return false;
        }).length)} new anime (approx).`;
        processInputBtn.disabled = false;
    });

    // Search Mode: Input change for dropdown
    let searchTimeout = null;
    animeSearchInput.addEventListener('input', async () => {
        clearTimeout(searchTimeout);

        const query = animeSearchInput.value.trim();
        if (query.length < 3) {
            searchResultsDropdown.innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(async () => {
            const results = await searchAnimeByName(query);
            searchResultsDropdown.innerHTML = '';

            if (results && results.length > 0) {
                results.forEach(anime => {
                    const resultDiv = document.createElement('div');
                    resultDiv.textContent = anime.title || anime.title_english || anime.title_japanese || 'Unknown Title';
                    resultDiv.dataset.malId = anime.mal_id;
                    searchResultsDropdown.appendChild(resultDiv);
                });
            } else {
                const noResultsDiv = document.createElement('div');
                noResultsDiv.textContent = 'No results found.';
                searchResultsDropdown.appendChild(noResultsDiv);
            }
        }, 300);
    });

    // Search Mode: Dropdown item click
    searchResultsDropdown.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.tagName === 'DIV' && target.dataset.malId) {
            const malId = parseInt(target.dataset.malId, 10);
            const apiData = await fetchAnimeById(malId);
            if (apiData) {
                const animeData = extractAnimeData(apiData);
                animeData.searchTerm = animeSearchInput.value.trim();
                const result = addAnimeToList(animeData);
                if (result === true) {
                    // Successfully added
                    animeSearchInput.value = '';
                    searchResultsDropdown.innerHTML = '';
                } else if (result.exists) {
                    // Already exists
                    alert(`"${animeData.name}" is already in your list.`);
                }
            } else {
                console.error(`Could not fetch full data for selected anime ID: ${malId}`);
            }
        }
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (!animeSearchInput.contains(event.target) && !searchResultsDropdown.contains(event.target)) {
            searchResultsDropdown.innerHTML = '';
        }
    });

    // Table header click for sorting
    animeTableHead.addEventListener('click', (event) => {
        const target = event.target;
        if (target.tagName === 'TH') {
            const sortBy = target.dataset.sortBy;
            if (sortBy) {
                if (currentSortColumn === sortBy) {
                    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortColumn = sortBy;
                    currentSortDirection = 'asc';
                }
                renderAnimeList();
            }
        }
    });

    // Clear List button click
    clearListBtn.addEventListener('click', clearList);

    // --- Export/Import Functions ---
    const exportList = () => {
        if (animeList.length === 0) {
            alert('Your list is empty. Nothing to export.');
            return;
        }

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            animeList: animeList
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anime-list-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importList = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // Validate the imported data
                if (!importData.animeList || !Array.isArray(importData.animeList)) {
                    throw new Error('Invalid file format: animeList array not found');
                }

                // Validate each anime entry
                const validAnimeList = importData.animeList.filter(anime => {
                    return anime && 
                           typeof anime.mal_id === 'number' && 
                           typeof anime.name === 'string';
                });

                if (validAnimeList.length === 0) {
                    throw new Error('No valid anime entries found in the file');
                }

                // Ask for confirmation
                if (confirm(`Found ${validAnimeList.length} valid anime entries. Import them?`)) {
                    // Merge with existing list, avoiding duplicates
                    const newAnimeList = [...animeList];
                    let addedCount = 0;

                    validAnimeList.forEach(anime => {
                        if (!newAnimeList.some(existing => existing.mal_id === anime.mal_id)) {
                            newAnimeList.push(anime);
                            addedCount++;
                        }
                    });

                    animeList = newAnimeList;
                    saveListToLocalStorage();
                    renderAnimeList();
                    alert(`Import complete. Added ${addedCount} new entries.`);
                }
            } catch (error) {
                alert(`Error importing file: ${error.message}`);
            }
        };
        reader.onerror = () => {
            alert('Error reading file');
        };
        reader.readAsText(file);
    };

    // --- Event Handlers ---
    exportListBtn.addEventListener('click', exportList);
    importListInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importList(e.target.files[0]);
            // Reset the input so the same file can be imported again
            e.target.value = '';
        }
    });

    // --- Filter Functions ---
    const populateGenreFilter = () => {
        genreFilterList.innerHTML = '';
        // Use the static list of genres
        const sortedGenres = ALL_STATIC_GENRES; // Already sorted during definition

        sortedGenres.forEach(genre => {
            const genreItem = document.createElement('div');
            genreItem.className = `genre-filter-item ${selectedGenres.has(genre) ? 'selected' : ''} ${['Erotica', 'Ecchi', 'Hentai'].includes(genre) ? 'adult' : ''}`;
            genreItem.textContent = genre;
            genreItem.onclick = () => {
                if (selectedGenres.has(genre)) {
                    selectedGenres.delete(genre);
                    genreItem.classList.remove('selected');
                } else {
                    selectedGenres.add(genre);
                    genreItem.classList.add('selected');
                }
            };
            genreFilterList.appendChild(genreItem);
        });
    };

    const populateThemeFilter = () => {
        themeFilterList.innerHTML = '';
        const sortedThemes = ALL_STATIC_THEMES; // Already sorted

        sortedThemes.forEach(theme => {
            const themeItem = document.createElement('div');
            themeItem.className = `theme-filter-item ${selectedThemes.has(theme) ? 'selected' : ''}`;
            themeItem.textContent = theme;
            themeItem.onclick = () => {
                if (selectedThemes.has(theme)) {
                    selectedThemes.delete(theme);
                    themeItem.classList.remove('selected');
                } else {
                    selectedThemes.add(theme);
                    themeItem.classList.add('selected');
                }
            };
            themeFilterList.appendChild(themeItem);
        });
    };

    const applyFilters = () => {
        console.log('Applying filters...');
        console.log('Current anime list:', animeList);
        
        // Check if any filters are active
        const hasActiveFilters = minScore.value || maxScore.value || minMembers.value || maxMembers.value || 
            minEpisodesFilter.value || maxEpisodesFilter.value ||
            yearFilter.value || seasonFilter.value || statusFilter.value || 
            selectedGenres.size > 0 || selectedThemes.size > 0;
        
        if (hasActiveFilters) {
            filteredList = animeList.filter(anime => {
                console.log('\nChecking anime:', anime.name);
                
                // Score filter
                const minScoreValue = parseFloat(minScore.value);
                const maxScoreValue = parseFloat(maxScore.value);
                if (!isNaN(minScoreValue) && anime.score < minScoreValue) {
                    console.log('Filtered by min score:', anime.score, '<', minScoreValue);
                    return false;
                }
                if (!isNaN(maxScoreValue) && anime.score > maxScoreValue) {
                    console.log('Filtered by max score:', anime.score, '>', maxScoreValue);
                    return false;
                }

                // Members filter
                const minMembersValue = parseInt(minMembers.value);
                const maxMembersValue = parseInt(maxMembers.value);
                console.log('Members check:', {
                    animeMembers: anime.members,
                    minMembersValue,
                    maxMembersValue
                });
                if (!isNaN(minMembersValue) && anime.members < minMembersValue) {
                    console.log('Filtered by min members:', anime.members, '<', minMembersValue);
                    return false;
                }
                if (!isNaN(maxMembersValue) && anime.members > maxMembersValue) {
                    console.log('Filtered by max members:', anime.members, '>', maxMembersValue);
                    return false;
                }

                // Min Episodes filter
                const minEpisodesValue = parseInt(minEpisodesFilter.value);
                if(anime.episodes === "?	"){
                    return false;
                }
                if (!isNaN(minEpisodesValue) && minEpisodesValue > 0) {
                    // Ensure anime.episodes is a number; treat 0 or non-numeric as not meeting criteria if minEpisodesValue > 0
                    const animeEpisodes = typeof anime.episodes === 'number' ? anime.episodes : 0;
                    if (animeEpisodes < minEpisodesValue) {
                        console.log('Filtered by min episodes:', animeEpisodes, '<', minEpisodesValue);
                        return false;
                    }
                }

                // Max Episodes filter
                const maxEpisodesValue = parseInt(maxEpisodesFilter.value);
                if (!isNaN(maxEpisodesValue) && maxEpisodesValue > 0) { // Only filter if a positive value is set
                    const animeEpisodes = typeof anime.episodes === 'number' ? anime.episodes : 0;
                    // If animeEpisodes is 0 (e.g. movie or unknown), it should pass unless maxEpisodesValue is also 0 (which we ignore due to >0 check)
                    // If animeEpisodes is a positive number, it must be <= maxEpisodesValue
                    if (animeEpisodes > 0 && animeEpisodes > maxEpisodesValue) {
                        console.log('Filtered by max episodes:', animeEpisodes, '>', maxEpisodesValue);
                        return false;
                    }
                }

                // Year filter
                const yearValue = parseInt(yearFilter.value);
                console.log('Year check:', {
                    animeYear: anime.year,
                    yearValue
                });
                if (!isNaN(yearValue) && anime.year !== yearValue) {
                    console.log('Filtered by year:', anime.year, '!==', yearValue);
                    return false;
                }

                // Season filter
                if (seasonFilter.value) {
                    const animeSeason = (anime.season || '').toLowerCase();
                    const filterSeason = seasonFilter.value.toLowerCase();
                    console.log('Season check:', {
                        animeSeason,
                        filterSeason
                    });
                    if (animeSeason !== filterSeason) {
                        console.log('Filtered by season:', animeSeason, '!==', filterSeason);
                        return false;
                    }
                }

                // Genre filter
                if (selectedGenres.size > 0) {
                    console.log('Genre check:', {
                        animeGenres: anime.genres,
                        selectedGenres: Array.from(selectedGenres),
                        mode: genreFilterMode
                    });
                    if (genreFilterMode === 'inclusive') {
                        if (!anime.genres || !anime.genres.some(genre => selectedGenres.has(genre))) {
                            console.log('Filtered by inclusive genres - anime does not have any selected genre');
                            return false;
                        }
                    } else if (genreFilterMode === 'all_selected') { // Anime must have ALL selected genres
                        if (!anime.genres || !Array.from(selectedGenres).every(selGenre => anime.genres.includes(selGenre))) {
                            console.log('Filtered by exclusive/all_selected genres - anime does not have all selected genres');
                            return false;
                        }
                    } else if (genreFilterMode === 'none_selected') { // Anime must have NONE of the selected genres
                        if (anime.genres && anime.genres.some(genre => selectedGenres.has(genre))) {
                            console.log('Filtered by none_selected (exclude) genres - anime has one or more of the selected genres');
                            return false;
                        }
                    }
                }

                // Theme filter (similar to genre filter)
                if (selectedThemes.size > 0) {
                    console.log('Theme check:', {
                        animeThemes: anime.themes,
                        selectedThemes: Array.from(selectedThemes),
                        mode: themeFilterMode
                    });
                    if (themeFilterMode === 'inclusive') {
                        if (!anime.themes || !anime.themes.some(theme => selectedThemes.has(theme))) {
                            console.log('Filtered by inclusive themes - anime does not have any selected theme');
                            return false;
                        }
                    } else if (themeFilterMode === 'all_selected') {
                        if (!anime.themes || !Array.from(selectedThemes).every(selTheme => anime.themes.includes(selTheme))) {
                            console.log('Filtered by all_selected themes - anime does not have all selected themes');
                            return false;
                        }
                    } else if (themeFilterMode === 'none_selected') {
                        if (anime.themes && anime.themes.some(theme => selectedThemes.has(theme))) {
                            console.log('Filtered by none_selected (exclude) themes - anime has one or more of the selected themes');
                            return false;
                        }
                    }
                }

                // Status filter
                if (statusFilter.value) {
                    console.log('Status check:', {
                        animeAdded: anime.added,
                        filterStatus: statusFilter.value
                    });
                    if (statusFilter.value === 'added' && !anime.added) {
                        console.log('Filtered by status: not added');
                        return false;
                    }
                    if (statusFilter.value === 'not-added' && anime.added) {
                        console.log('Filtered by status: added');
                        return false;
                    }
                }

                console.log('Anime passed all filters');
                return true;
            });
        } else {
            // If no filters are active, reset to full list
            filteredList = null;
        }

        console.log('Filtered list:', filteredList);
        renderAnimeList();
    };

    const resetFilters = () => {
        minScore.value = '';
        maxScore.value = '';
        minMembers.value = '';
        maxMembers.value = '';
        minEpisodesFilter.value = '';
        maxEpisodesFilter.value = '';
        yearFilter.value = '';
        seasonFilter.value = '';
        statusFilter.value = '';
        selectedGenres.clear();
        genreFilterMode = 'inclusive'; // Default mode
        document.querySelector('input[name="genreFilterMode"][value="inclusive"]').checked = true;
        if (document.querySelector('input[name="genreFilterMode"][value="all_selected"]')) {
            document.querySelector('input[name="genreFilterMode"][value="all_selected"]').checked = false;
        }
        if (document.querySelector('input[name="genreFilterMode"][value="none_selected"]')) {
            document.querySelector('input[name="genreFilterMode"][value="none_selected"]').checked = false;
        }
        populateGenreFilter();

        selectedThemes.clear();
        themeFilterMode = 'inclusive';
        if(document.querySelector('input[name="themeFilterMode"][value="inclusive"]')){
            document.querySelector('input[name="themeFilterMode"][value="inclusive"]').checked = true;
        }
        if (document.querySelector('input[name="themeFilterMode"][value="all_selected"]')) {
            document.querySelector('input[name="themeFilterMode"][value="all_selected"]').checked = false;
        }
        if (document.querySelector('input[name="themeFilterMode"][value="none_selected"]')) {
            document.querySelector('input[name="themeFilterMode"][value="none_selected"]').checked = false;
        }
        populateThemeFilter();

        filteredList = null;
        renderAnimeList();
    };

    // --- Event Handlers ---
    applyFiltersBtn.addEventListener('click', applyFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);

    document.querySelectorAll('input[name="genreFilterMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            genreFilterMode = e.target.value;
        });
    });

    document.querySelectorAll('input[name="themeFilterMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            themeFilterMode = e.target.value;
        });
    });

    // --- Batch Mode Elements ---
    batchModeBtn.addEventListener('click', () => {
        batchModeSection.classList.remove('hidden');
        inputModeSection.classList.add('hidden');
        searchModeSection.classList.add('hidden');
        batchModeBtn.classList.add('active');
        inputModeBtn.classList.remove('active');
        searchModeBtn.classList.remove('active');
        inputStatus.textContent = '';
        searchResultsDropdown.innerHTML = '';
    });

    // --- Batch Mode Logic ---
    const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];
    function getSeasonInterval(startSeason, startYear, endSeason, endYear) {
        const result = [];
        let year = startYear;
        let seasonIdx = SEASONS.indexOf(startSeason);
        const endIdx = SEASONS.indexOf(endSeason);
        while (year < endYear || (year === endYear && seasonIdx <= endIdx)) {
            result.push({ season: SEASONS[seasonIdx], year });
            if (seasonIdx === 3) {
                seasonIdx = 0;
                year++;
            } else {
                seasonIdx++;
            }
        }
        return result;
    }

    async function fetchBatchAnime() {
        const startSeason = batchStartSeason.value;
        const startYear = parseInt(batchStartYear.value);
        const endSeason = batchEndSeason.value;
        const endYear = parseInt(batchEndYear.value);
        const minMembersEnabled = batchMinMembersCheckbox.checked;
        const minMembersValue = 1000;

        if (!startSeason || isNaN(startYear) || !endSeason || isNaN(endYear)) {
            batchStatus.textContent = 'Please select valid start and end seasons/years.';
            return;
        }

        batchStatus.textContent = 'Preparing batch fetch...';
        batchFetchBtn.disabled = true;
        let addedCount = 0;
        let checkedCount = 0;
        const interval = getSeasonInterval(startSeason, startYear, endSeason, endYear);

        for (let i = 0; i < interval.length; i++) {
            const { season, year } = interval[i];
            let page = 1;
            let seasonFetchingActive = true;

            while (seasonFetchingActive) {
                batchStatus.textContent = `Fetching ${season} ${year}, page ${page}... (added: ${addedCount}, checked: ${checkedCount})`;
                try {
                    const apiUrl = `${JIKAN_API_BASE_URL}/seasons/${year}/${season.toLowerCase()}?page=${page}`;
                    const resp = await fetch(apiUrl);

                    if (!resp.ok) {
                        batchStatus.textContent = `Error fetching ${season} ${year} page ${page}: ${resp.status}. Skipping to next season/year or ending.`;
                        await new Promise(r => setTimeout(r, 2500));
                        seasonFetchingActive = false;
                        continue;
                    }

                    const data = await resp.json();

                    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                        let allOnPageBelowThreshold = true;

                        for (const animeEntry of data.data) {
                            checkedCount++;
                            const animeMembers = typeof animeEntry.members === 'string' 
                                ? parseInt(animeEntry.members.replace(/,/g, ''), 10) 
                                : (animeEntry.members || 0);

                            if (minMembersEnabled) {
                                if (animeMembers >= minMembersValue) {
                                    allOnPageBelowThreshold = false;
                                    if (!animeList.some(a => a.mal_id === animeEntry.mal_id)) {
                                        const animeData = extractAnimeData(animeEntry);
                                        if (!animeData.season) animeData.season = season.toLowerCase();
                                        if (!animeData.year) animeData.year = year;
                                        animeData.searchTerm = `${animeData.name || 'Anime'} (batch)`;
                                        animeList.push(animeData);
                                        addedCount++;
                                    }
                                }
                            } else {
                                allOnPageBelowThreshold = false;
                                if (!animeList.some(a => a.mal_id === animeEntry.mal_id)) {
                                    const animeData = extractAnimeData(animeEntry);
                                    if (!animeData.season) animeData.season = season.toLowerCase();
                                    if (!animeData.year) animeData.year = year;
                                    animeData.searchTerm = `${animeData.name || 'Anime'} (batch)`;
                                    animeList.push(animeData);
                                    addedCount++;
                                }
                            }
                        }
                        saveListToLocalStorage();
                        renderAnimeList();

                        let hasNextPageAccordingToAPI = data.pagination && data.pagination.has_next_page;

                        if (minMembersEnabled && allOnPageBelowThreshold) {
                            batchStatus.textContent = `Stopping ${season} ${year} after page ${page}: all on page below ${minMembersValue} members.`;
                            seasonFetchingActive = false;
                        } else if (!hasNextPageAccordingToAPI) {
                            seasonFetchingActive = false;
                        } else {
                            page++;
                            await new Promise(r => setTimeout(r, 2500));
                        }
                    } else {
                        seasonFetchingActive = false;
                    }
                } catch (e) {
                    batchStatus.textContent = `Error processing ${season} ${year} page ${page}: ${e.message}. Skipping to next season/year.`;
                    seasonFetchingActive = false;
                }
            }
        }

        batchStatus.textContent = `Batch complete! Added ${addedCount} new anime (checked ${checkedCount}).`;
        batchFetchBtn.disabled = false;
    }

    batchFetchBtn.addEventListener('click', fetchBatchAnime);
    
    function hideInputModes(){
        inputModeSection.classList.add('hidden');
        searchModeSection.classList.add('hidden');
        inputModeBtn.classList.remove('active');
        searchModeBtn.classList.remove('active');
        batchModeSection.classList.add('hidden');
        batchModeBtn.classList.remove('active');
        searchResultsDropdown.innerHTML = '';
    }

    // NAVIGATION
    const navigateToNextYear = () => {
        if(yearFilter.value){
            seasonFilter.value = "";
            yearFilter.value = parseInt(yearFilter.value) + 1
        }else{
            return;
        }
        applyFilters();
    }
    
    const navigateToPreviousYear= () => {
        if(yearFilter.value){
            seasonFilter.value = "";
            yearFilter.value = parseInt(yearFilter.value) - 1;
        }else{
            return;
        }
        applyFilters();
    }
    
    const navigateToNextSeason = () => {
        console.log('nextSeason');
        if(!yearFilter.value){
            yearFilter.value = 2025;
        }
        if(seasonFilter.value === ""){
            seasonFilter.value = "Winter";
        }else if(seasonFilter.value === "Winter"){
            seasonFilter.value = "Spring";
        }else if(seasonFilter.value === "Spring"){
            seasonFilter.value = "Summer";
        }else if(seasonFilter.value === "Summer"){
            seasonFilter.value = "Fall";
        }else{
            seasonFilter.value = "Winter";
            yearFilter.value = parseInt(yearFilter.value) + 1;
        }
        applyFilters();
    }
    const navigateToPreviousSeason = () => {
        if(!yearFilter.value){
            yearFilter.value = 2025;
        }
        if(seasonFilter.value === ""){
            seasonFilter.value = "Winter";
        }else if(seasonFilter.value === "Winter"){
            yearFilter.value = parseInt(yearFilter.value) - 1;
            seasonFilter.value = "Fall";
        }else if(seasonFilter.value === "Fall"){
            seasonFilter.value = "Summer";
        }else if(seasonFilter.value === "Summer"){
            seasonFilter.value = "Spring";
        }else{
            seasonFilter.value = "Winter";
        }
        applyFilters();
    }
    previousYearBtn.addEventListener('click', navigateToPreviousYear);
    nextYearBtn.addEventListener('click', navigateToNextYear);
    previousSeasonBtn.addEventListener('click', navigateToPreviousSeason);
    nextSeasonBtn.addEventListener('click', navigateToNextSeason);

    // Preset Filter Button Logic
    document.querySelectorAll('.preset-btn').forEach(button => {
        button.addEventListener('click', () => {
            const minMembersVal = button.dataset.minMembers;
            const maxMembersVal = button.dataset.maxMembers;
            const minScoreVal = button.dataset.minScore;
            const maxScoreVal = button.dataset.maxScore;

            if (minMembersVal !== undefined && maxMembersVal !== undefined) {
                minMembers.value = minMembersVal;
                maxMembers.value = maxMembersVal;
            }

            if (minScoreVal !== undefined && maxScoreVal !== undefined) {
                minScore.value = minScoreVal;
                maxScore.value = maxScoreVal;
            }
            
            applyFilters();
        });
    });

    // --- Initialization ---
    loadListFromLocalStorage();
    hideInputModes();

    // Global click listener to close the info window when clicking outside
    document.addEventListener('click', (event) => {
        if (globalTooltip && globalTooltip.classList.contains('active')) {
            const isClickInsideTooltip = globalTooltip.contains(event.target);
            const isClickOnNameLink = event.target.classList.contains('anime-name-link') || event.target.closest('.anime-name-link');

            if (!isClickInsideTooltip && !isClickOnNameLink) {
                globalTooltip.classList.remove('active');
                currentOpenAnimeLink = null;
            }
        }
    });
});


