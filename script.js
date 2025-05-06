document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const inputModeBtn = document.getElementById('inputModeBtn');
    const searchModeBtn = document.getElementById('searchModeBtn');
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

    // --- State Variables ---
    let animeList = []; // Array to hold anime objects
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
                    if (typeof anime.members !== 'number') {
                        anime.members = parseInt(anime.members, 10) || 0;
                    }
                    if (typeof anime.score !== 'number') {
                        anime.score = parseFloat(anime.score) || 0;
                    }
                    if (typeof anime.year !== 'number') {
                        anime.year = parseInt(anime.year, 10) || 0;
                    }
                });
            } catch (e) {
                console.error("Failed to parse anime list from localStorage:", e);
                animeList = []; // Reset if parsing fails
            }
        } else {
            animeList = [];
        }
        renderAnimeList(); // Render the list after loading
    };

    // Function to save list to local storage
    const saveListToLocalStorage = () => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(animeList));
    };

    // --- UI Rendering ---

    // Function to render the anime list in the table
    const renderAnimeList = () => {
        animeTableBody.innerHTML = ''; // Clear current table body
        emptyListMessage.classList.add('hidden'); // Hide empty message by default

        if (animeList.length === 0) {
            emptyListMessage.classList.remove('hidden'); // Show empty message if list is empty
            return;
        }

        // Sort the list before rendering
        const sortedList = sortAnimeList(animeList, currentSortColumn, currentSortDirection);

        sortedList.forEach((anime, index) => {
            const row = animeTableBody.insertRow();
            
            // Name cell with link and tooltip
            const nameCell = row.insertCell(0);
            const nameLink = document.createElement('a');
            nameLink.href = `https://myanimelist.net/anime/${anime.mal_id}`;
            nameLink.target = '_blank';
            nameLink.className = 'anime-name-link tooltip';
            nameLink.textContent = anime.name;
            
            // Add tooltip
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip-text';
            tooltip.textContent = `Search term: ${anime.searchTerm || anime.name}`;
            nameLink.appendChild(tooltip);
            nameCell.appendChild(nameLink);

            // Season & Year cell
            row.insertCell(1).textContent = `${anime.season || 'N/A'} ${anime.year || 'N/A'}`;
            
            // Members cell
            row.insertCell(2).textContent = anime.members.toLocaleString();
            
            // Score cell
            row.insertCell(3).textContent = anime.score ? anime.score.toFixed(2) : 'N/A';
            
            // Actions cell
            const actionsCell = row.insertCell(4);
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => openEditModal(index);
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => deleteAnime(index);
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    };

    // Function to sort the anime list
    const sortAnimeList = (list, column, direction) => {
        return [...list].sort((a, b) => {
            let comparison = 0;
            const aValue = a[column];
            const bValue = b[column];

            if (column === 'seasonYear') {
                // Custom sort for Season & Year
                const aYear = a.year || 0;
                const bYear = b.year || 0;
                const aSeason = a.season || '';
                const bSeason = b.season || '';

                if (aYear !== bYear) {
                    comparison = aYear - bYear;
                } else {
                    comparison = aSeason.localeCompare(bSeason);
                }
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
            // Get the anime from the sorted list
            const sortedList = sortAnimeList(animeList, currentSortColumn, currentSortDirection);
            const animeToDelete = sortedList[index];
            
            // Find the actual index in the original list using MAL ID
            const actualIndex = animeList.findIndex(anime => anime.mal_id === animeToDelete.mal_id);
            
            if (actualIndex !== -1) {
                animeList.splice(actualIndex, 1);
                saveListToLocalStorage();
                renderAnimeList();
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
        return {
            mal_id: apiData.mal_id,
            name: apiData.title || apiData.title_english || apiData.title_japanese || 'Unknown Title',
            season: apiData.season,
            year: apiData.year,
            members: apiData.members || 0,
            score: apiData.score || 0,
            searchTerm: apiData.searchTerm // This will be set when adding from search
        };
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
        searchResultsDropdown.innerHTML = '';
    });

    searchModeBtn.addEventListener('click', () => {
        searchModeSection.classList.remove('hidden');
        inputModeSection.classList.add('hidden');
        searchModeBtn.classList.add('active');
        inputModeBtn.classList.remove('active');
        inputStatus.textContent = '';
    });

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

    // --- Initialization ---
    loadListFromLocalStorage();
});
