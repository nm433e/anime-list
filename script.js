document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Configuration & Initialization ---
    // IMPORTANT: Replace with your Firebase project's configuration
    const firebaseConfig = {
        apiKey: "AIzaSyBSMYaL2lAxQi2NeOvG-P0EN8BtlDptWKg",
        authDomain: "anime-list-cac07.firebaseapp.com",
        projectId: "anime-list-cac07",
        storageBucket: "anime-list-cac07.firebasestorage.app",
        messagingSenderId: "78050819094",
        appId: "1:78050819094:web:d71b70b563269296284937"
    };

    let db;
    let auth; // Firebase Auth instance
    let currentUser = null; // Store current authenticated user

    try {
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        auth = firebase.auth(); // Initialize Firebase Auth
        console.log("Firebase initialized successfully (Firestore & Auth).");
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        alert("Could not connect to Firebase. Please check your configuration and ensure Firebase SDKs are correctly loaded.");
        document.getElementById('emptyListMessage').textContent = 'Error connecting to Firebase.';
        if(document.getElementById('authStatus')) document.getElementById('authStatus').textContent = 'Firebase connection error.';
        return; 
    }

    const ANIME_COLLECTION = 'animeCollection'; 

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
    const closeModalBtn = document.querySelector('.close'); 
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
    const minYearFilter = document.getElementById('minYearFilter');
    const maxYearFilter = document.getElementById('maxYearFilter');
    const genreFilterList = document.getElementById('genreFilterList');
    const themeFilterList = document.getElementById('themeFilterList');
    const statusFilter = document.getElementById('statusFilter');
    const batchModeBtn = document.getElementById('batchModeBtn');
    const batchModeSection = document.getElementById('batchModeSection');
    const batchStartSeason = document.getElementById('batchStartSeason');
    const batchStartYear = document.getElementById('batchStartYear');
    const batchEndSeason = document.getElementById('batchEndSeason');
    const batchEndYear = document.getElementById('batchEndYear');
    const batchFetchBtn = document.getElementById('batchFetchBtn');
    const batchStatus = document.getElementById('batchStatus');
    const finalPage = document.getElementById('finalPage'); 
    const previousYearBtn = document.getElementById('previousYearBtn');
    const nextYearBtn = document.getElementById('nextYearBtn');
    const previousSeasonBtn = document.getElementById('previousSeasonBtn');
    const nextSeasonBtn = document.getElementById('nextSeasonBtn');
    const resultsCountMessage = document.getElementById('resultsCountMessage');
    const listSearchInput = document.getElementById('listSearchInput');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    
    // Auth UI elements
    const authStatusSpan = document.getElementById('authStatus');
    const loginBtn = document.getElementById('loginBtn'); 
    const logoutBtn = document.getElementById('logoutBtn');

    // --- Global Tooltip Element ---
    let globalTooltip = null;
    function createGlobalTooltip() {
        if (!globalTooltip) {
            globalTooltip = document.createElement('div');
            globalTooltip.id = 'globalAnimeTooltip';
            document.body.appendChild(globalTooltip);
        }
    }
    createGlobalTooltip();
    let currentOpenAnimeLink = null;

    // --- Static Data ---
    const ALL_STATIC_GENRES = [
        "Action", "Adventure", "Avant Garde", "Award Winning", "Boys Love", "Comedy", "Drama",
        "Ecchi", "Erotica", "Fantasy", "Girls Love", "Gourmet", "Hentai", "Horror", "Mystery",
        "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Suspense"
    ].sort();

    const ALL_STATIC_THEMES = [
        "Adult Cast", "Anthropomorphic", "CGDCT", "Childcare", "Combat Sports", "Crossdressing",
        "Delinquents", "Detective", "Educational", "Gag Humor", "Gore", "Harem", "High Stakes Game",
        "Historical", "Idols (Female)", "Idols (Male)", "Isekai", "Iyashikei", "Love Polygon",
        "Magical Sex Shift", "Mahou Shoujo", "Martial Arts", "Mecha", "Medical", "Military", "Music",
        "Mythology", "Organized Crime", "Otaku Culture", "Parody", "Performing Arts", "Pets",
        "Psychological", "Racing", "Reincarnation", "Reverse Harem", "Samurai", "School", "Showbiz",
        "Space", "Strategy Game", "Super Power", "Survival", "Team Sports", "Time Travel",
        "Urban Fantasy", "Vampire", "Video Game", "Villainess", "Visual Arts", "Workplace"
    ].sort();

    // --- State Variables ---
    let animeList = []; 
    let filteredList = null;
    let selectedGenres = new Set();
    let genreFilterMode = 'inclusive';
    let selectedThemes = new Set();
    let themeFilterMode = 'inclusive';
    const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';
    const INPUT_MODE_DELAY = 1500;
    let currentSortColumn = 'members';
    let currentSortDirection = 'desc';
    let currentEditMalId = null; 
    let currentSearchTerm = '';

    // --- Firebase Auth Functions ---
    const signInWithGoogle = async () => {
        if (!auth) {
            authStatusSpan.textContent = "Auth service not available.";
            return;
        }
        authStatusSpan.textContent = "Logging in with Google...";
        const provider = new firebase.auth.GoogleAuthProvider(); 
        try {
            await auth.signInWithPopup(provider); 
            console.log("Signed in with Google successfully.");
        } catch (error) {
            console.error("Error signing in with Google:", error);
            authStatusSpan.textContent = `Google login failed: ${error.message}`;
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                authStatusSpan.textContent = "Login cancelled. Please try again.";
            }
            updateAuthUI(null); 
        }
    };

    const signOutUser = async () => {
        if (!auth) return;
        try {
            await auth.signOut();
            console.log("User signed out.");
        } catch (error) {
            console.error("Error signing out:", error);
            authStatusSpan.textContent = `Logout failed: ${error.message}`;
        }
    };

    // --- Auth State Change Listener ---
    auth.onAuthStateChanged(async (user) => {
        currentUser = user; 
        if (user) {
            console.log("Auth state changed: User logged in", user.uid, user.displayName || user.email);
            authStatusSpan.textContent = `Logged in as ${user.displayName || user.email || 'User'} (UID: ${user.uid.substring(0,6)}...)`;
            updateAuthUI(user);
            enableAppFeatures(true);
            await loadListFromFirebase(); 
        } else {
            console.log("Auth state changed: User logged out");
            authStatusSpan.textContent = "Not logged in. Please log in to use the app.";
            animeList = []; 
            applyFilters(); 
            updateAuthUI(null);
            enableAppFeatures(false);
            emptyListMessage.textContent = 'Please log in to load or add anime.';
            emptyListMessage.classList.remove('hidden');
        }
    });

    function updateAuthUI(user) {
        if (user) {
            loginBtn.textContent = 'Login with Google'; 
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
        } else {
            loginBtn.textContent = 'Login with Google'; 
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    }

    function enableAppFeatures(enable) {
        const featureButtons = [
            processInputBtn, batchFetchBtn, clearListBtn, exportListBtn, 
            confirmEdit, ...document.querySelectorAll('.action-btn'), 
        ];
        const featureInputs = [
            animeInputList, animeSearchInput, importListInput, newAnimeId,
            minScore, maxScore, minMembers, maxMembers, minEpisodesFilter, maxEpisodesFilter,
            yearFilter, seasonFilter, statusFilter, listSearchInput,
            minYearFilter, maxYearFilter,
            batchStartSeason, batchStartYear, batchEndSeason, batchEndYear, finalPage
        ];
        
        featureButtons.forEach(btn => btn.disabled = !enable);
        featureInputs.forEach(input => input.disabled = !enable);

        if (!enable) {
            inputModeSection.classList.add('hidden');
            searchModeSection.classList.add('hidden');
            batchModeSection.classList.add('hidden');
            inputModeBtn.classList.remove('active');
            searchModeBtn.classList.remove('active');
            batchModeBtn.classList.remove('active');
            if (!hideModeBtn.classList.contains('active')) { 
                 hideModeBtn.classList.add('active');
            }
        }
    }


    // --- Firebase Data Operations ---
    const loadListFromFirebase = async () => {
        if (!db || !currentUser) { 
            console.warn("Firestore not available or user not logged in. Cannot load list.");
            animeList = [];
            applyFilters(); 
            emptyListMessage.textContent = currentUser ? 'Error: Firestore not available.' : 'Please log in to load your list.';
            emptyListMessage.classList.remove('hidden');
            return;
        }
        emptyListMessage.textContent = 'Loading anime from Firebase...';
        emptyListMessage.classList.remove('hidden');

        try {
            const snapshot = await db.collection(ANIME_COLLECTION).get(); 

            const loadedAnime = [];
            snapshot.forEach(doc => {
                const anime = doc.data();
                // Perform data cleaning/normalization
                const cleanedAnime = {
                    mal_id: parseInt(anime.mal_id, 10) || 0, // Ensure mal_id is a number
                    name: anime.name || 'Unknown Title',
                    english_name: anime.english_name || '',
                    season: anime.season || null,
                    year: parseInt(anime.year, 10) || null,
                    members: parseInt(String(anime.members).replace(/,/g, ''), 10) || 0,
                    score: parseFloat(anime.score) || 0,
                    episodes: parseInt(anime.episodes, 10) || 0,
                    genres: Array.isArray(anime.genres) ? anime.genres.filter(g => typeof g === 'string') : [],
                    themes: Array.isArray(anime.themes) ? anime.themes.filter(t => typeof t === 'string') : [],
                    cover: anime.cover || '',
                    synopsis: anime.synopsis || 'Synopsis not available.',
                    added: typeof anime.added === 'boolean' ? anime.added : false,
                };
                loadedAnime.push(cleanedAnime);
            });
            animeList = loadedAnime;
            applyFilters(); 
            console.log("Anime list loaded from Firebase:", animeList.length, "items");
            if (animeList.length === 0) {
                 emptyListMessage.textContent = 'Your list is empty. Add some anime!';
                 emptyListMessage.classList.remove('hidden');
            } else {
                emptyListMessage.classList.add('hidden');
            }
        } catch (error) {
            console.error("Error loading anime list from Firebase:", error);
            animeList = [];
            emptyListMessage.textContent = 'Failed to load list from Firebase. Check security rules and ensure you are logged in.';
            emptyListMessage.classList.remove('hidden');
            renderAnimeList(); 
        }
    };

    const addAnimeToFirebase = async (animeData) => {
        if (!db || !currentUser) return false; 
        if (!animeData || typeof animeData.mal_id !== 'number' || isNaN(animeData.mal_id)) {
            console.error("addAnimeToFirebase: Invalid animeData or mal_id.", animeData);
            return false;
        }
        try {
            // Ensure no undefined fields are being sent
            const dataToSet = { ...animeData };
            for (const key in dataToSet) {
                if (dataToSet[key] === undefined) {
                    // Decide on a default: null for optional, '' for strings, 0 for numbers, [] for arrays
                    if (['season', 'year'].includes(key)) dataToSet[key] = null;
                    else if (['members', 'score', 'episodes'].includes(key)) dataToSet[key] = 0;
                    else if (Array.isArray(dataToSet[key])) dataToSet[key] = []; // Should not happen if extractAnimeData is robust
                    else dataToSet[key] = ''; // General default for strings
                    console.warn(`Field '${key}' was undefined before saving MAL ID ${dataToSet.mal_id}. Defaulted.`);
                }
            }
            await db.collection(ANIME_COLLECTION).doc(String(dataToSet.mal_id)).set(dataToSet);
            console.log(`Anime "${dataToSet.name}" (ID: ${dataToSet.mal_id}) added/updated in Firebase.`);
            return true;
        } catch (error) {
            console.error(`Error adding anime (MAL ID: ${animeData.mal_id}) to Firebase:`, error, animeData);
            return false;
        }
    };

    const updateAnimeInFirebase = async (malId, updatedData) => {
        if (!db || !currentUser) return false; 
        try {
            // Ensure no undefined fields in updatedData
            const dataToUpdate = { ...updatedData };
            for (const key in dataToUpdate) {
                if (dataToUpdate[key] === undefined) {
                    // For updates, it's often better to delete the field if it becomes undefined,
                    // or set it to a specific null/default value.
                    // firebase.firestore.FieldValue.delete() can be used to remove a field.
                    // For simplicity here, we'll assign a default, but review if field deletion is better.
                    if (['season', 'year'].includes(key)) dataToUpdate[key] = null;
                    else if (['members', 'score', 'episodes'].includes(key)) dataToUpdate[key] = 0;
                    else dataToUpdate[key] = ''; 
                    console.warn(`Field '${key}' in update was undefined for MAL ID ${malId}. Defaulted.`);
                }
            }
            await db.collection(ANIME_COLLECTION).doc(String(malId)).update(dataToUpdate);
            console.log(`Anime ID: ${malId} updated in Firebase.`);
            return true;
        } catch (error) {
            console.error("Error updating anime in Firebase:", error);
            return false;
        }
    };

    const deleteAnimeFromFirebase = async (malId) => {
        if (!db || !currentUser) return false; 
        try {
            await db.collection(ANIME_COLLECTION).doc(String(malId)).delete();
            console.log(`Anime ID: ${malId} deleted from Firebase.`);
            return true;
        } catch (error) {
            console.error("Error deleting anime from Firebase:", error);
            return false;
        }
    };

    const clearListInFirebase = async () => {
        if (!db || !currentUser) return; 
        batchStatus.textContent = 'Clearing list from Firebase...';
        try {
            const snapshot = await db.collection(ANIME_COLLECTION).get();
            const batchOp = db.batch(); 
            snapshot.docs.forEach(doc => {
                batchOp.delete(doc.ref);
            });
            await batchOp.commit();
            animeList = []; 
            applyFilters(); 
            batchStatus.textContent = 'List cleared from Firebase.';
            console.log("Anime list cleared from Firebase.");
        } catch (error) {
            console.error("Error clearing list from Firebase:", error);
            batchStatus.textContent = 'Error clearing list.';
        }
    };


    // --- UI Rendering ---
    const renderAnimeList = () => {
        animeTableBody.innerHTML = '';
        emptyListMessage.classList.add('hidden');

        const listToRender = filteredList !== null ? filteredList : animeList;

        if (!currentUser) { 
            emptyListMessage.textContent = 'Please log in to see your anime list.';
            emptyListMessage.classList.remove('hidden');
            resultsCountMessage.textContent = 'Logged out.';
            return;
        }
        
        if (listToRender.length === 0 && animeList.length > 0 && filteredList !== null) {
             emptyListMessage.textContent = 'No anime match your current filters.';
             emptyListMessage.classList.remove('hidden');
        } else if (listToRender.length === 0) {
            if (emptyListMessage.textContent === 'Loading anime from Firebase...') {
                // Keep loading message
            } else if (animeList.length === 0 && currentUser) {
                 emptyListMessage.textContent = 'Your list is empty. Add some anime!';
            } else {
                 emptyListMessage.textContent = 'No results to display for current filters.';
            }
            emptyListMessage.classList.remove('hidden');
            resultsCountMessage.textContent = 'No results to display.';
            return;
        }

        const sortedList = sortAnimeList(listToRender, currentSortColumn, currentSortDirection);
        sortedList.forEach((anime, index) => {
            const row = animeTableBody.insertRow();
            row.dataset.malId = anime.mal_id; 

            // Selection checkbox column
            const selectCell = row.insertCell(0);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'row-select-checkbox';
            checkbox.dataset.malId = anime.mal_id;
            checkbox.addEventListener('change', onRowSelectChange);
            selectCell.appendChild(checkbox);

            // Number column
            row.insertCell(1).textContent = index + 1;

            const nameCell = row.insertCell(2);
            const nameLink = document.createElement('a');
            nameLink.href = `https://myanimelist.net/anime/${anime.mal_id}`;
            nameLink.target = '_blank';
            nameLink.className = 'anime-name-link';
            nameLink.textContent = anime.name;
            nameCell.appendChild(nameLink);

            nameLink.addEventListener('click', (event) => {
                event.preventDefault();
                if (globalTooltip.classList.contains('active') && currentOpenAnimeLink === nameLink) {
                    globalTooltip.classList.remove('active');
                    currentOpenAnimeLink = null;
                } else {
                    populateAndShowTooltip(anime, nameLink);
                    currentOpenAnimeLink = nameLink;
                }
            });

            row.insertCell(3).textContent = `${anime.season || 'N/A'} ${anime.year || 'N/A'}`;
            row.insertCell(4).textContent = anime.members ? anime.members.toLocaleString() : 'N/A';
            row.insertCell(5).textContent = anime.score ? anime.score.toFixed(2) : 'N/A';
            row.insertCell(6).textContent = anime.episodes || '?';

            const genresCell = row.insertCell(7);
            const genreListDiv = document.createElement('div'); 
            genreListDiv.className = 'genre-list';
            if (anime.genres && anime.genres.length > 0) {
                anime.genres.forEach(genre => {
                    const genreSpan = document.createElement('span');
                    genreSpan.className = 'genre';
                    if (['Erotica', 'Ecchi', 'Hentai'].includes(genre)) {
                        genreSpan.classList.add('adult');
                    }
                    genreSpan.textContent = genre;
                    genreListDiv.appendChild(genreSpan);
                });
            } else {
                genreListDiv.textContent = 'N/A';
            }
            genresCell.appendChild(genreListDiv);

            const themesCell = row.insertCell(8);
            const themeListDiv = document.createElement('div'); 
            themeListDiv.className = 'theme-list';
            if (anime.themes && anime.themes.length > 0) {
                anime.themes.forEach(theme => {
                    const themeSpan = document.createElement('span');
                    themeSpan.className = 'theme';
                    themeSpan.textContent = theme;
                    themeListDiv.appendChild(themeSpan);
                });
            } else {
                themeListDiv.textContent = 'N/A';
            }
            themesCell.appendChild(themeListDiv);

            const actionsCell = row.insertCell(9);
            const toggleBtn = document.createElement('button');
            toggleBtn.className = `action-btn toggle-btn ${anime.added ? 'added' : ''}`;
            toggleBtn.innerHTML = anime.added ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
            toggleBtn.title = anime.added ? 'Mark as Not Added' : 'Mark as Added';
            toggleBtn.onclick = () => toggleAnimeAddedStatus(anime.mal_id); 

            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
            editBtn.title = 'Edit';
            editBtn.onclick = () => openEditModal(anime.mal_id); 

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete';
            deleteBtn.onclick = () => deleteAnime(anime.mal_id); 

            actionsCell.appendChild(toggleBtn);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });

        const count = listToRender.length;
        if (filteredList !== null) { 
            resultsCountMessage.textContent = `Displaying ${count} filtered results (out of ${animeList.length} total).`;
        } else {
            resultsCountMessage.textContent = `Displaying ${count} results.`;
        }
         if (listToRender.length > 0) {
            emptyListMessage.classList.add('hidden');
        }
    };

    function populateAndShowTooltip(anime, nameLink) {
        if (!currentUser) return; 
        globalTooltip.innerHTML = `
 
            <h4 class="tooltip-title">${anime.name}</h4>
            <div class="tooltip-middle-section">
                <img src="${anime.cover || 'placeholder.png'}" alt="${anime.name} cover" class="tooltip-cover-image" onerror="this.src='https://placehold.co/150x225/cccccc/333333?text=No+Image';">
                <p class="tooltip-synopsis">${anime.synopsis || 'Synopsis not available.'}</p>
            </div>
            <div class="tooltip-stats-section">
                ${anime.genres && anime.genres.length > 0 ? `<div class="tooltip-genres"><strong>Genres:</strong> ${anime.genres.map(g => `<span class="tooltip-genre-pill">${g}</span>`).join(' ')}</div>` : ''}
                ${anime.themes && anime.themes.length > 0 ? `<div class="tooltip-themes"><strong>Themes:</strong> ${anime.themes.map(t => `<span class="tooltip-theme-pill">${t}</span>`).join(' ')}</div>` : ''}
                <div class="tooltip-members-score">
                    <span class="tooltip-stat"><i class="fas fa-users"></i> ${anime.members ? anime.members.toLocaleString() : 'N/A'}</span>
                    <span class="tooltip-stat"><i class="fas fa-star"></i> ${anime.score ? anime.score.toFixed(2) : 'N/A'}</span>
                </div>
            </div>
            <div class="info-window-actions">
                <a href="https://myanimelist.net/anime/${anime.mal_id}" target="_blank" rel="noopener noreferrer" class="info-action-btn mal-btn">MAL</a>
                <a href="https://hianimez.to/search?keyword=${encodeURIComponent(anime.name)}" target="_blank" rel="noopener noreferrer" class="info-action-btn hi-btn">HiAnimez</a>
                <a href="https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.name)}" target="_blank" rel="noopener noreferrer" class="info-action-btn cr-btn">Crunchyroll</a>
                <a href="https://www.netflix.com/search?q=${encodeURIComponent(anime.name)}" target="_blank" rel="noopener noreferrer" class="info-action-btn nf-btn">Netflix</a>
                <button type="button" class="info-action-btn copy-btn" data-anime-title="${anime.name}">Copy Title</button>
                           <button type="button" class="tooltip-toggle-added-btn ${anime.added ? 'added' : ''}" data-mal-id="${anime.mal_id}" title="${anime.added ? 'Mark as Not Added' : 'Mark as Added'}">
                ${anime.added ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}
            </button>
            </div>
        `;

        const copyBtn = globalTooltip.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => copyTitleToClipboard(copyBtn.dataset.animeTitle, copyBtn));
        }

        const tooltipToggleAddedBtn = globalTooltip.querySelector('.tooltip-toggle-added-btn');
        if (tooltipToggleAddedBtn) {
            tooltipToggleAddedBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const malId = parseInt(tooltipToggleAddedBtn.dataset.malId);
                await toggleAnimeAddedStatus(malId, true); 
            });
        }

        globalTooltip.classList.add('active');
        requestAnimationFrame(() => {
            const linkRect = nameLink.getBoundingClientRect();
            const tooltipRect = globalTooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            let top = linkRect.top + scrollY - tooltipRect.height - 10;
            let left = linkRect.left + scrollX + (linkRect.width / 2) - (tooltipRect.width / 2);

            if (top < scrollY + 10) top = linkRect.bottom + scrollY + 10;
            if (top + tooltipRect.height > scrollY + viewportHeight - 10) top = scrollY + viewportHeight - tooltipRect.height - 10;
            if (left < scrollX + 10) left = scrollX + 10;
            if (left + tooltipRect.width > scrollX + viewportWidth - 10) left = scrollX + viewportWidth - tooltipRect.width - 10;
            
            globalTooltip.style.top = `${Math.max(scrollY + 10, top)}px`;
            globalTooltip.style.left = `${left}px`;
        });
    }

    const SEASON_ORDER = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 };
    function capitalizeSeason(season) {
        if (!season) return ''; // Return empty string, not null or undefined
        return season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
    }

    const sortAnimeList = (list, column, direction) => {
        return [...list].sort((a, b) => {
            let comparison = 0;
            let aValue = a[column];
            let bValue = b[column];

            if (column === 'seasonYear') {
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
                const aFirstGenre = (a.genres && a.genres[0]) || '';
                const bFirstGenre = (b.genres && b.genres[0]) || '';
                comparison = aFirstGenre.localeCompare(bFirstGenre);
            } else if (column === 'themes') {
                const aFirstTheme = (a.themes && a.themes[0]) || '';
                const bFirstTheme = (b.themes && b.themes[0]) || '';
                comparison = aFirstTheme.localeCompare(bFirstTheme);
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else { 
                const strA = String(aValue).toLowerCase();
                const strB = String(bValue).toLowerCase();
                comparison = strA.localeCompare(strB);
            }
            return direction === 'asc' ? comparison : -comparison;
        });
    };

    // --- Modal Functions ---
    const openEditModal = (malId) => {
        if (!currentUser) return; 
        const animeToEdit = animeList.find(a => a.mal_id === malId);
        if (!animeToEdit) {
            console.error("Anime to edit not found in local list:", malId);
            return;
        }
        currentEditMalId = malId; 
        newAnimeId.value = ''; 
        editStatus.textContent = `Editing: ${animeToEdit.name}. Enter new MAL ID if you want to replace it.`;
        editModal.style.display = 'block';
    };

    const closeEditModal = () => {
        editModal.style.display = 'none';
        currentEditMalId = null;
        newAnimeId.value = '';
        editStatus.textContent = '';
    };

    // --- Event Handlers for Modal ---
    if (closeModalBtn) closeModalBtn.onclick = closeEditModal;
    window.onclick = (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
    };

    confirmEdit.onclick = async () => {
        if (!currentUser || !currentEditMalId) { 
            editStatus.textContent = 'Error: Not logged in or no anime selected for editing.';
            return;
        }
        const newIdToFetch = parseInt(newAnimeId.value);
        if (isNaN(newIdToFetch) || newIdToFetch <= 0) {
            editStatus.textContent = 'Please enter a valid new MAL ID to fetch and replace.';
            return;
        }

        editStatus.textContent = 'Fetching new anime data...';
        const apiData = await fetchAnimeById(newIdToFetch);
        
        if (!apiData) {
            editStatus.textContent = 'Failed to fetch new anime data. Check MAL ID.';
            return;
        }

        const newAnimeData = extractAnimeData(apiData);
        if (!newAnimeData) { // extractAnimeData now returns null for bad data
             editStatus.textContent = 'Could not process new anime data (invalid or missing critical info).';
            return;
        }
        
        const deleteSuccess = await deleteAnimeFromFirebase(currentEditMalId);
        if (!deleteSuccess) {
            editStatus.textContent = 'Failed to remove old anime entry from Firebase. Aborting update.';
            return;
        }

        const addSuccess = await addAnimeToFirebase(newAnimeData);
        if (addSuccess) {
            const oldIndex = animeList.findIndex(a => a.mal_id === currentEditMalId);
            if (oldIndex !== -1) animeList.splice(oldIndex, 1); 
            
            const existingNewIndex = animeList.findIndex(a => a.mal_id === newAnimeData.mal_id);
            if (existingNewIndex !== -1) {
                animeList[existingNewIndex] = newAnimeData; 
            } else {
                animeList.push(newAnimeData); 
            }

            applyFilters(); 
            editStatus.textContent = `Successfully replaced MAL ID ${currentEditMalId} with ${newAnimeData.name} (ID: ${newAnimeData.mal_id}).`;
            setTimeout(closeEditModal, 2000);
        } else {
            editStatus.textContent = 'Failed to add new anime data to Firebase. Old entry was removed.';
            await loadListFromFirebase(); 
        }
    };

    // --- Delete Function ---
    const deleteAnime = async (malId) => {
        if (!currentUser) return; 
        const animeToDelete = animeList.find(a => a.mal_id === malId);
        if (!animeToDelete) {
            console.error("Anime to delete not found in local list:", malId);
            return;
        }

        if (confirm(`Are you sure you want to delete "${animeToDelete.name}" from your list?`)) {
            const success = await deleteAnimeFromFirebase(malId);
            if (success) {
                animeList = animeList.filter(anime => anime.mal_id !== malId);
                applyFilters(); 
                console.log(`Anime "${animeToDelete.name}" deleted.`);
            } else {
                alert("Failed to delete anime from Firebase. Please try again.");
            }
        }
    };

    // --- API Interaction (Jikan) ---
    const fetchAnimeById = async (id) => {
        try {
            const response = await fetch(`${JIKAN_API_BASE_URL}/anime/${id}`);
            if (!response.ok) {
                console.warn(`Anime with ID ${id} not found or API error: ${response.status}`);
                return null;
            }
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(`Error fetching anime by ID ${id}:`, error);
            return null;
        }
    };

    const searchAnimeByName = async (name) => {
        try {
            const encodedName = encodeURIComponent(name);
            const response = await fetch(`${JIKAN_API_BASE_URL}/anime?q=${encodedName}&limit=10`);
            if (!response.ok) {
                console.warn(`No results for "${name}" or API error: ${response.status}`);
                return [];
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error(`Error searching for anime "${name}":`, error);
            return [];
        }
    };

    const extractAnimeData = (apiData) => {
        if (!apiData || typeof apiData.mal_id === 'undefined' || apiData.mal_id === null) {
            console.warn("extractAnimeData: apiData or apiData.mal_id is missing/null. Cannot extract.", apiData);
            return null;
        }

        const mal_id_parsed = parseInt(apiData.mal_id, 10);
        if (isNaN(mal_id_parsed)) {
            console.warn("extractAnimeData: mal_id is not a number. Cannot extract.", apiData.mal_id);
            return null;
        }

        // Filter genres and themes to ensure they are arrays of valid strings
        const genres = (apiData.genres || [])
            .map(genre => genre.name)
            .filter(name => typeof name === 'string' && name.trim() !== '');

        const themes = (apiData.themes || [])
            .map(theme => theme.name)
            .filter(name => typeof name === 'string' && name.trim() !== '');

        const coverImageUrl = (apiData.images?.webp?.image_url) || (apiData.images?.jpg?.image_url) || '';

        const parsedYear = parseInt(apiData.year, 10);
        const yearValue = !isNaN(parsedYear) ? parsedYear : null;

        const parsedMembers = parseInt(String(apiData.members).replace(/,/g, ''), 10);
        const membersValue = !isNaN(parsedMembers) ? parsedMembers : 0;

        const parsedScore = parseFloat(apiData.score);
        const scoreValue = !isNaN(parsedScore) ? parsedScore : 0;

        const parsedEpisodes = parseInt(apiData.episodes, 10);
        const episodesValue = !isNaN(parsedEpisodes) ? parsedEpisodes : 0;

        const extracted = {
            mal_id: mal_id_parsed,
            name: apiData.title || apiData.title_english || apiData.title_japanese || 'Unknown Title',
            english_name: apiData.title_english || '',
            season: apiData.season ? capitalizeSeason(apiData.season) : null, // capitalizeSeason returns '' if !apiData.season
            year: yearValue,
            members: membersValue,
            score: scoreValue,
            episodes: episodesValue,
            genres: genres, 
            themes: themes, 
            cover: coverImageUrl, 
            synopsis: apiData.synopsis || 'Synopsis not available.',
            added: false 
        };
        
        // Safeguard: Ensure no top-level fields are undefined. This should ideally not be needed
        // if all fields are constructed with defaults above.
        // for (const key in extracted) {
        //     if (extracted[key] === undefined) {
        //         console.warn(`extractAnimeData: Safeguard - Field '${key}' was undefined for MAL ID ${mal_id_parsed}. Applying default.`);
        //         if (key === 'year' || key === 'season') extracted[key] = null;
        //         else if (key === 'members' || key === 'score' || key === 'episodes') extracted[key] = 0;
        //         else if (key === 'genres' || key === 'themes') extracted[key] = [];
        //         else if (typeof extracted[key] === 'string') extracted[key] = ''; // For potential string fields
        //         // else, leave as is or assign a more generic null if type is unknown
        //     }
        // }
        return extracted;
    };

    // Function to toggle anime added status
    const toggleAnimeAddedStatus = async (malId, updateTooltipButton = false) => {
        if (!currentUser) return; 
        const animeIndex = animeList.findIndex(a => a.mal_id === malId);
        if (animeIndex === -1) {
            console.error("Anime to toggle not found in local list:", malId);
            return;
        }

        const animeToToggle = animeList[animeIndex];
        const newAddedStatus = !animeToToggle.added;
        animeToToggle.added = newAddedStatus; 
        
        const row = animeTableBody.querySelector(`tr[data-mal-id="${malId}"]`);
        if (row) {
            const toggleBtnInRow = row.querySelector('.toggle-btn');
            if (toggleBtnInRow) {
                toggleBtnInRow.innerHTML = newAddedStatus ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
                toggleBtnInRow.title = newAddedStatus ? 'Mark as Not Added' : 'Mark as Added';
                if (newAddedStatus) toggleBtnInRow.classList.add('added');
                else toggleBtnInRow.classList.remove('added');
            }
        }
        
        if (updateTooltipButton && globalTooltip.classList.contains('active')) {
            const tooltipToggleBtn = globalTooltip.querySelector(`.tooltip-toggle-added-btn[data-mal-id="${malId}"]`);
            if (tooltipToggleBtn) {
                tooltipToggleBtn.innerHTML = newAddedStatus ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
                tooltipToggleBtn.title = newAddedStatus ? 'Mark as Not Added' : 'Mark as Added';
                if (newAddedStatus) tooltipToggleBtn.classList.add('added');
                else tooltipToggleBtn.classList.remove('added');
            }
        }
        
        const success = await updateAnimeInFirebase(malId, { added: newAddedStatus });
        if (!success) {
            animeToToggle.added = !newAddedStatus; 
            alert("Failed to update status in Firebase. Please try again.");
            applyFilters(); 
        } else {
             if (statusFilter.value) { 
                applyFilters();
            }
        }
    };

    // Function to add anime to the list (local and Firebase)
    const addAnimeToList = async (animeDataFromExtract) => {
        if (!currentUser) return { success: false, exists: false, message: "Not logged in." }; 
        
        if (!animeDataFromExtract) { // Check if extractAnimeData returned null
            console.warn("addAnimeToList: Received null animeDataFromExtract. Cannot add.");
            return { success: false, exists: false, message: "Invalid anime data (extraction failed)." };
        }
        // animeDataFromExtract is already the cleaned object
        const animeData = animeDataFromExtract;


        if (!animeData.mal_id || typeof animeData.mal_id !== 'number' || isNaN(animeData.mal_id)) {
            console.warn("addAnimeToList: Invalid or missing mal_id in processed animeData.", animeData);
            return { success: false, exists: false, message: "Invalid anime ID after processing." };
        }

        const existingAnime = animeList.find(anime => anime.mal_id === animeData.mal_id);
        if (existingAnime) {
            return { success: false, exists: true, name: existingAnime.name, message: "Already exists." };
        }

        const success = await addAnimeToFirebase(animeData); // animeData is now the cleaned object
        if (success) {
            animeList.push(animeData);
            applyFilters(); 
            return { success: true, exists: false, name: animeData.name, message: "Added." };
        } else {
            return { success: false, exists: false, message: "Failed to save to Firebase." };
        }
    };

    // --- Clear List Function ---
    const clearList = async () => {
        if (!currentUser) { 
            alert("Please log in to clear the list.");
            return;
        }
        if (confirm('Are you sure you want to clear the entire list from Firebase? This action cannot be undone.')) {
            await clearListInFirebase();
        }
    };

    // --- Event Handlers ---
    loginBtn.addEventListener('click', signInWithGoogle); 
    logoutBtn.addEventListener('click', signOutUser);

    inputModeBtn.addEventListener('click', () => switchMode('input'));
    searchModeBtn.addEventListener('click', () => switchMode('search'));
    batchModeBtn.addEventListener('click', () => switchMode('batch'));
    hideModeBtn.addEventListener('click', () => switchMode('hidden'));

    function switchMode(mode) {
        if (!currentUser && mode !== 'hidden') { 
            inputStatus.textContent = "Please log in to use this feature.";
            return;
        }

        inputModeSection.classList.add('hidden');
        searchModeSection.classList.add('hidden');
        batchModeSection.classList.add('hidden');

        inputModeBtn.classList.remove('active');
        searchModeBtn.classList.remove('active');
        batchModeBtn.classList.remove('active');
        hideModeBtn.classList.remove('active'); 

        searchResultsDropdown.innerHTML = '';
        inputStatus.textContent = ''; 

        if (mode === 'input') {
            inputModeSection.classList.remove('hidden');
            inputModeBtn.classList.add('active');
        } else if (mode === 'search') {
            searchModeSection.classList.remove('hidden');
            searchModeBtn.classList.add('active');
        } else if (mode === 'batch') {
            batchModeSection.classList.remove('hidden');
            batchModeBtn.classList.add('active');
        } else if (mode === 'hidden') {
            hideModeBtn.classList.add('active');
        }
    }

    processInputBtn.addEventListener('click', async () => {
        if (!currentUser) return; 
        const lines = animeInputList.value.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length === 0) {
            inputStatus.textContent = 'No input lines found.';
            return;
        }

        inputStatus.textContent = `Processing ${lines.length} lines...`;
        processInputBtn.disabled = true;
        let succeededCount = 0; 

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            inputStatus.textContent = `Processing line ${i + 1} of ${lines.length}: "${line}"`;
            let jikanApiData = null; // Renamed to avoid confusion with extracted data
            const malId = parseInt(line, 10);

            if (!isNaN(malId)) {
                jikanApiData = await fetchAnimeById(malId);
                if (!jikanApiData) inputStatus.textContent += ` - ID ${malId} not found or fetch failed.`;
            } else {
                const searchResults = await searchAnimeByName(line);
                if (searchResults && searchResults.length > 0) {
                    jikanApiData = await fetchAnimeById(searchResults[0].mal_id); 
                    if(!jikanApiData) inputStatus.textContent += ` - Found match "${searchResults[0].title}", but couldn't fetch full data.`;
                } else {
                    inputStatus.textContent += ` - No search results for "${line}".`;
                }
            }

            if (jikanApiData) {
                const animeDataForDb = extractAnimeData(jikanApiData); // Extract and clean
                if (animeDataForDb) { // Check if extraction was successful
                    const result = await addAnimeToList(animeDataForDb); 
                    if (result.success) {
                        inputStatus.textContent += ` - Added "${animeDataForDb.name}".`;
                        succeededCount++;
                    } else if (result.exists) {
                        inputStatus.textContent += ` - Skipped "${result.name}" (already exists).`;
                    } else {
                         inputStatus.textContent += ` - Failed to add "${animeDataForDb.name}". Reason: ${result.message}`;
                    }
                } else {
                    inputStatus.textContent += ` - Failed to process data for "${line}".`;
                }
            }
            if (i < lines.length - 1) await new Promise(resolve => setTimeout(resolve, INPUT_MODE_DELAY));
        }
        inputStatus.textContent = `Processing complete. Successfully processed ${succeededCount} new anime.`;
        processInputBtn.disabled = false;
        animeInputList.value = ''; 
    });

    let searchTimeout = null;
    animeSearchInput.addEventListener('input', () => {
        if (!currentUser) return; 
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
                searchResultsDropdown.innerHTML = '<div>No results found.</div>';
            }
        }, 300);
    });

    searchResultsDropdown.addEventListener('click', async (event) => {
        if (!currentUser) return; 
        const target = event.target;
        if (target.tagName === 'DIV' && target.dataset.malId) {
            const malId = parseInt(target.dataset.malId, 10);
            const searchStatus = inputStatus; 
            searchStatus.textContent = `Fetching details for ID ${malId}...`; 
            const jikanApiData = await fetchAnimeById(malId);
            if (jikanApiData) {
                const animeDataForDb = extractAnimeData(jikanApiData);
                if (animeDataForDb) {
                    const result = await addAnimeToList(animeDataForDb); 
                    if (result.success) {
                        searchStatus.textContent = `Added "${animeDataForDb.name}" to your list.`;
                        animeSearchInput.value = '';
                        searchResultsDropdown.innerHTML = '';
                    } else if (result.exists) {
                        searchStatus.textContent = `"${result.name}" is already in your list.`;
                    } else {
                        searchStatus.textContent = `Failed to add "${animeDataForDb.name}". ${result.message}`;
                    }
                } else {
                     searchStatus.textContent = `Could not process data for ID: ${malId}`;
                }
            } else {
                searchStatus.textContent = `Could not fetch full data for ID: ${malId}`;
            }
        }
    });

    document.addEventListener('click', (event) => { 
        if (!animeSearchInput.contains(event.target) && !searchResultsDropdown.contains(event.target)) {
            searchResultsDropdown.innerHTML = '';
        }
        if (globalTooltip && globalTooltip.classList.contains('active')) {
            const isClickInsideTooltip = globalTooltip.contains(event.target);
            const isClickOnNameLink = event.target.classList.contains('anime-name-link') || event.target.closest('.anime-name-link');
            if (!isClickInsideTooltip && !isClickOnNameLink) {
                globalTooltip.classList.remove('active');
                currentOpenAnimeLink = null;
            }
        }
    });

    animeTableHead.addEventListener('click', (event) => {
        if (!currentUser) return; 
        const target = event.target.closest('th'); 
        if (target && target.dataset.sortBy) {
            const sortBy = target.dataset.sortBy;
            if (currentSortColumn === sortBy) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortBy;
                currentSortDirection = 'asc'; 
            }
            renderAnimeList(); 
        }
    });

    clearListBtn.addEventListener('click', clearList); 

    // --- Export/Import Functions ---
    const exportList = () => {
        if (!currentUser) { 
            alert("Please log in to export the list.");
            return;
        }
        if (animeList.length === 0) {
            alert('Your list is empty. Nothing to export.');
            return;
        }
        const exportData = {
            version: '1.4-firebase-google-auth-uid', 
            exportDate: new Date().toISOString(),
            animeList: animeList,
            userUid: currentUser ? currentUser.uid : null
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anime-list-firebase-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importList = (file) => {
        if (!db || !currentUser) {
            alert("Please log in before importing a list.");
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (!Array.isArray(importedData.animeList)) {
                    throw new Error("Invalid import file format: 'animeList' array is missing or not an array.");
                }

                // Check userUid only if it exists in the imported file
                if (importedData.hasOwnProperty('userUid') && importedData.userUid !== currentUser.uid) {
                    if (!confirm("This list belongs to a different user (UID mismatch). Import anyway? Your current list might be overwritten where MAL IDs match, or items will be merged.")) {
                        return;
                    }
                }

                let successCount = 0;
                let failCount = 0;
                const animeToImport = importedData.animeList;
                const totalToImport = animeToImport.length;

                if (totalToImport === 0) {
                    emptyListMessage.textContent = "Import finished. No anime found in the file to import.";
                    console.log("Import finished. No anime to import.");
                    importListInput.value = ''; // Reset file input
                    return;
                }

                emptyListMessage.textContent = `Importing anime... 0 of ${totalToImport} processed.`;
                emptyListMessage.classList.remove('hidden');

                const MAX_BATCH_SIZE = 499; // Firestore batch limit is 500 operations
                let batch = db.batch();
                let operationsInCurrentBatch = 0;

                for (let i = 0; i < totalToImport; i++) {
                    const anime = animeToImport[i];
                    
                    if (anime && typeof anime.mal_id !== 'undefined') {
                        try {
                            // Ensure mal_id is a string for document ID
                            const docRef = db.collection(ANIME_COLLECTION).doc(String(anime.mal_id));
                            batch.set(docRef, anime);
                            operationsInCurrentBatch++;
                            successCount++;

                            if (operationsInCurrentBatch >= MAX_BATCH_SIZE) {
                                await batch.commit();
                                console.log(`Committed a batch of ${operationsInCurrentBatch} anime records.`);
                                batch = db.batch(); // Start a new batch
                                operationsInCurrentBatch = 0;
                            }
                        } catch (e) {
                            console.warn("Skipping invalid anime entry during import processing (error during batch add):", anime, e);
                            failCount++;
                        }
                    } else {
                        console.warn("Skipping invalid anime entry during import (missing mal_id or invalid structure):", anime);
                        failCount++;
                    }

                    if ((i + 1) % 10 === 0 || (i + 1) === totalToImport) {
                         emptyListMessage.textContent = `Importing anime... ${i + 1} of ${totalToImport} processed. ${successCount} prepared, ${failCount} skipped.`;
                    }
                }

                if (operationsInCurrentBatch > 0) {
                    await batch.commit(); // Commit the final batch
                    console.log(`Committed the final batch of ${operationsInCurrentBatch} anime records.`);
                }

                emptyListMessage.textContent = `Import finished. ${successCount} anime records processed for import. ${failCount} failed/skipped.`;
                console.log(`Import finished. ${successCount} anime records processed for import, ${failCount} failed/skipped.`);
                await loadListFromFirebase(); // Reload the list from Firebase
            } catch (error) {
                console.error("Error importing list:", error);
                alert("Error importing list: " + error.message);
                emptyListMessage.textContent = "Error importing list. Please check the console.";
            } finally {
                importListInput.value = ''; // Reset file input
            }
        };
        reader.onerror = () => {
            alert("Error reading file.");
            importListInput.value = ''; // Reset file input
            emptyListMessage.textContent = "Error reading import file.";
        };
        reader.readAsText(file);
    };

    exportListBtn.addEventListener('click', exportList);
    importListInput.addEventListener('change', (e) => {
        if (!currentUser) { 
            alert("Please log in to import files.");
            e.target.value = ''; 
            return;
        }
        if (e.target.files.length > 0) {
            importList(e.target.files[0]);
            e.target.value = '';
        }
    });

    // --- Filter Functions ---
    const populateGenreFilter = () => {
        genreFilterList.innerHTML = '';
        ALL_STATIC_GENRES.forEach(genre => {
            const genreItem = document.createElement('div');
            genreItem.className = `genre-filter-item ${selectedGenres.has(genre) ? 'selected' : ''} ${['Erotica', 'Ecchi', 'Hentai'].includes(genre) ? 'adult' : ''}`;
            genreItem.textContent = genre;
            genreItem.onclick = () => {
                if (!currentUser) return; 
                if (selectedGenres.has(genre)) selectedGenres.delete(genre);
                else selectedGenres.add(genre);
                genreItem.classList.toggle('selected');
                applyFilters();
            };
            genreFilterList.appendChild(genreItem);
        });
    };

    const populateThemeFilter = () => {
        themeFilterList.innerHTML = '';
        ALL_STATIC_THEMES.forEach(theme => {
            const themeItem = document.createElement('div');
            themeItem.className = `theme-filter-item ${selectedThemes.has(theme) ? 'selected' : ''}`;
            themeItem.textContent = theme;
            themeItem.onclick = () => {
                if (!currentUser) return; 
                if (selectedThemes.has(theme)) selectedThemes.delete(theme);
                else selectedThemes.add(theme);
                themeItem.classList.toggle('selected');
                applyFilters();
            };
            themeFilterList.appendChild(themeItem);
        });
    };
    
    let listSearchTimeout;
    listSearchInput.addEventListener('input', (e) => {
        if (!currentUser) return; 
        clearTimeout(listSearchTimeout);
        listSearchTimeout = setTimeout(() => {
            currentSearchTerm = e.target.value.toLowerCase().trim();
            applyFilters();
        }, 300); 
    });

    const applyFilters = () => {
        if (!currentUser && animeList.length > 0) { 
            filteredList = [];
            renderAnimeList();
            return;
        }
        if (!currentUser && animeList.length === 0) { 
            renderAnimeList(); 
            return;
        }

        let filteredResults = [...animeList]; 

        if (currentSearchTerm) {
            filteredResults = filteredResults.filter(anime =>
                (anime.name && anime.name.toLowerCase().includes(currentSearchTerm)) ||
                (anime.english_name && anime.english_name.toLowerCase().includes(currentSearchTerm))
            );
        }
        
        const minScoreVal = parseFloat(minScore.value);
        const maxScoreVal = parseFloat(maxScore.value);
        const minMembersVal = parseInt(minMembers.value);
        const maxMembersVal = parseInt(maxMembers.value);
        const minEpisodesVal = parseInt(minEpisodesFilter.value);
        const maxEpisodesVal = parseInt(maxEpisodesFilter.value);
        const yearVal = parseInt(yearFilter.value);
        const minYearVal = parseInt(minYearFilter.value);
        const maxYearVal = parseInt(maxYearFilter.value);
        const seasonVal = seasonFilter.value ? seasonFilter.value.toLowerCase() : "";
        const statusVal = statusFilter.value;

        filteredResults = filteredResults.filter(anime => {
            if (!isNaN(minScoreVal) && anime.score < minScoreVal) return false;
            if (!isNaN(maxScoreVal) && anime.score > maxScoreVal) return false;
            if (!isNaN(minMembersVal) && anime.members < minMembersVal) return false;
            if (!isNaN(maxMembersVal) && anime.members > maxMembersVal) return false;
            if (!isNaN(minEpisodesVal) && anime.episodes < minEpisodesVal) return false;
            if (!isNaN(maxEpisodesVal) && anime.episodes > maxEpisodesVal) return false;
            if (!isNaN(yearVal)) {
                if (anime.year !== yearVal) return false;
            }
            if (!isNaN(minYearVal) && anime.year < minYearVal) return false;
            if (!isNaN(maxYearVal) && anime.year > maxYearVal) return false;
            if (seasonVal && (anime.season || '').toLowerCase() !== seasonVal) return false;
            
            if (statusVal === 'added' && !anime.added) return false;
            if (statusVal === 'not-added' && anime.added) return false;

            if (selectedGenres.size > 0) {
                const animeGenres = new Set(anime.genres || []);
                if (genreFilterMode === 'inclusive' && !Array.from(selectedGenres).some(sg => animeGenres.has(sg))) return false;
                if (genreFilterMode === 'all_selected' && !Array.from(selectedGenres).every(sg => animeGenres.has(sg))) return false;
                if (genreFilterMode === 'none_selected' && Array.from(selectedGenres).some(sg => animeGenres.has(sg))) return false;
            }
            if (selectedThemes.size > 0) {
                const animeThemes = new Set(anime.themes || []);
                if (themeFilterMode === 'inclusive' && !Array.from(selectedThemes).some(st => animeThemes.has(st))) return false;
                if (themeFilterMode === 'all_selected' && !Array.from(selectedThemes).every(st => animeThemes.has(st))) return false;
                if (themeFilterMode === 'none_selected' && Array.from(selectedThemes).some(st => animeThemes.has(st))) return false;
            }
            return true;
        });

        filteredList = filteredResults;
        renderAnimeList();
    };

    const filterInputs = [minScore, maxScore, minMembers, maxMembers, minEpisodesFilter, maxEpisodesFilter, yearFilter, seasonFilter, statusFilter, minYearFilter, maxYearFilter];
    filterInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (!currentUser) return; applyFilters();
        });
    });
    document.querySelectorAll('input[name="genreFilterMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => { 
            if (!currentUser) return; genreFilterMode = e.target.value; applyFilters(); 
        });
    });
    document.querySelectorAll('input[name="themeFilterMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => { 
            if (!currentUser) return; themeFilterMode = e.target.value; applyFilters(); 
        });
    });

    const resetFilters = () => {
        if (!currentUser) return; 
        filterInputs.forEach(input => input.value = ''); 
        seasonFilter.value = ''; 
        statusFilter.value = ''; 
        minYearFilter.value = '';
        maxYearFilter.value = '';
        selectedGenres.clear();
        genreFilterMode = 'inclusive';
        document.querySelector('input[name="genreFilterMode"][value="inclusive"]').checked = true;
        populateGenreFilter(); 

        selectedThemes.clear();
        themeFilterMode = 'inclusive';
        document.querySelector('input[name="themeFilterMode"][value="inclusive"]').checked = true;
        populateThemeFilter(); 

        listSearchInput.value = '';
        currentSearchTerm = '';

        filteredList = null; 
        applyFilters(); 
    };
    resetFiltersBtn.addEventListener('click', resetFilters);

    // --- Batch Mode Logic ---
    const SEASONS_ORDER = ['Winter', 'Spring', 'Summer', 'Fall']; 
    function getSeasonInterval(startSeason, startYear, endSeason, endYear) {
        const result = [];
        let currentYear = startYear;
        let currentSeasonIndex = SEASONS_ORDER.indexOf(capitalizeSeason(startSeason));
        const endTargetYear = endYear;
        const endTargetSeasonIndex = SEASONS_ORDER.indexOf(capitalizeSeason(endSeason));

        while (currentYear < endTargetYear || (currentYear === endTargetYear && currentSeasonIndex <= endTargetSeasonIndex)) {
            result.push({ season: SEASONS_ORDER[currentSeasonIndex], year: currentYear });
            currentSeasonIndex++;
            if (currentSeasonIndex >= SEASONS_ORDER.length) {
                currentSeasonIndex = 0;
                currentYear++;
            }
        }
        return result;
    }

    async function fetchBatchAnime() {
        if (!currentUser) { 
            batchStatus.textContent = "Please log in to use batch fetch.";
            return;
        }
        const startS = batchStartSeason.value;
        const startY = parseInt(batchStartYear.value);
        const endS = batchEndSeason.value;
        const endY = parseInt(batchEndYear.value);
        const userFinalPage = parseInt(finalPage.value) || Infinity;
        const minMembersValue = 10000; // Hardcoded minimum members filter for batch mode

        if (!startS || isNaN(startY) || !endS || isNaN(endY) || startY > endY || (startY === endY && SEASONS_ORDER.indexOf(capitalizeSeason(startS)) > SEASONS_ORDER.indexOf(capitalizeSeason(endS)))) {
            batchStatus.textContent = 'Please select a valid start and end season/year range.';
            return;
        }

        batchStatus.textContent = 'Preparing batch fetch...';
        batchFetchBtn.disabled = true;
        let totalAddedCount = 0;
        let totalCheckedCount = 0;
        let totalSkippedLowMembers = 0;
        const interval = getSeasonInterval(startS, startY, endS, endY);

        const MAX_FIRESTORE_BATCH_SIZE = 499; // Firestore batch limit
        let firestoreBatch = db.batch();
        let operationsInCurrentFirestoreBatch = 0;

        for (let i = 0; i < interval.length; i++) {
            const { season, year } = interval[i];
            let page = 1;
            let seasonFetchingActive = true;
            // seasonAddedCount can be useful if we decide to commit per season, but not strictly needed for now
            // let seasonAddedCount = 0; 

            while (seasonFetchingActive && page <= userFinalPage) {
                batchStatus.textContent = `Fetching ${season} ${year}, P${page} (Added: ${totalAddedCount}, Chk: ${totalCheckedCount}, Skip: ${totalSkippedLowMembers})`;
                try {
                    const apiUrl = `${JIKAN_API_BASE_URL}/seasons/${year}/${season.toLowerCase()}?page=${page}`;
                    const resp = await fetch(apiUrl);

                    if (!resp.ok) {
                        batchStatus.textContent = `Error ${season} ${year} P${page}: ${resp.status}. Skipping season.`;
                        await new Promise(r => setTimeout(r, INPUT_MODE_DELAY)); 
                        seasonFetchingActive = false; 
                        continue;
                    }
                    const data = await resp.json();

                    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                        let allOnPageBelowThreshold = true;

                        for (const animeEntry of data.data) {
                            totalCheckedCount++;
                            const animeMembers = typeof animeEntry.members === 'string' 
                                ? parseInt(animeEntry.members.replace(/,/g, ''), 10) 
                                : (animeEntry.members || 0);

                            if (animeMembers >= minMembersValue) {
                                allOnPageBelowThreshold = false; 
                                const extracted = extractAnimeData(animeEntry);
                                
                                // Check if anime already exists in the main animeList (loaded from Firebase)
                                if (extracted && !animeList.some(a => a.mal_id === extracted.mal_id)) {
                                    if (!extracted.season) extracted.season = capitalizeSeason(season);
                                    if (!extracted.year) extracted.year = year;

                                    const docRef = db.collection(ANIME_COLLECTION).doc(String(extracted.mal_id));
                                    firestoreBatch.set(docRef, extracted);
                                    operationsInCurrentFirestoreBatch++;
                                    
                                    // Temporarily add to a separate list for this batch session or rely on reload
                                    // For simplicity, we'll assume loadListFromFirebase() after batch is enough
                                    // or we can push to animeList and accept it's only fully synced after batch.
                                    // For the check `!animeList.some`, the current animeList (from initial load) is used.
                                    // To avoid re-adding in same batch session, we could use a temporary set for this session.

                                    totalAddedCount++;
                                    // seasonAddedCount++;

                                    if (operationsInCurrentFirestoreBatch >= MAX_FIRESTORE_BATCH_SIZE) {
                                        await firestoreBatch.commit();
                                        console.log(`Committed a Firestore batch of ${operationsInCurrentFirestoreBatch} records (batch fetch).`);
                                        firestoreBatch = db.batch(); 
                                        operationsInCurrentFirestoreBatch = 0;
                                    }
                                }
                            } else {
                                totalSkippedLowMembers++;
                            }
                        }
                        
                        if (allOnPageBelowThreshold && page > 1) { 
                            batchStatus.textContent = `Stopping ${season} ${year} after P${page}: all on page < ${minMembersValue} members.`;
                            seasonFetchingActive = false;
                        } else if (!data.pagination || !data.pagination.has_next_page) {
                            seasonFetchingActive = false; 
                        } else {
                            page++;
                            await new Promise(r => setTimeout(r, INPUT_MODE_DELAY)); 
                        }
                    } else {
                        seasonFetchingActive = false; 
                    }
                } catch (e) {
                    batchStatus.textContent = `Error ${season} ${year} P${page}: ${e.message}. Skipping season.`;
                    seasonFetchingActive = false; 
                    await new Promise(r => setTimeout(r, INPUT_MODE_DELAY));
                }
            }
        }

        if (operationsInCurrentFirestoreBatch > 0) {
            await firestoreBatch.commit(); 
            console.log(`Committed final Firestore batch of ${operationsInCurrentFirestoreBatch} records (batch fetch).`);
        }
        
        await loadListFromFirebase(); // Reload the list to include all newly added items
        batchStatus.textContent = `Batch complete! Added: ${totalAddedCount} (Checked: ${totalCheckedCount}, Skipped Low Members: ${totalSkippedLowMembers}). List reloaded.`;
        batchFetchBtn.disabled = false;
    }
    batchFetchBtn.addEventListener('click', fetchBatchAnime);

    // --- Navigation for Filters ---
    const navigateYear = (increment) => {
        if (!currentUser) return;
        if (yearFilter.value) {
            seasonFilter.value = ""; 
            yearFilter.value = parseInt(yearFilter.value) + increment;
            applyFilters();
        } else {
            const currentYearVal = new Date().getFullYear(); 
            yearFilter.value = currentYearVal + increment;
            applyFilters();
        }
    };
    const navigateSeason = (increment) => {
        if (!currentUser) return;
        let currentYearVal = yearFilter.value ? parseInt(yearFilter.value) : new Date().getFullYear(); 
        let currentSeason = seasonFilter.value;
        let seasonIndex = currentSeason ? SEASONS_ORDER.indexOf(capitalizeSeason(currentSeason)) : -1;

        seasonIndex += increment;

        if (seasonIndex >= SEASONS_ORDER.length) {
            seasonIndex = 0;
            currentYearVal++; 
        } else if (seasonIndex < 0) {
            seasonIndex = SEASONS_ORDER.length - 1;
            currentYearVal--; 
        }
        yearFilter.value = currentYearVal; 
        seasonFilter.value = SEASONS_ORDER[seasonIndex];
        applyFilters();
    };

    previousYearBtn.addEventListener('click', () => navigateYear(-1));
    nextYearBtn.addEventListener('click', () => navigateYear(1));
    previousSeasonBtn.addEventListener('click', () => navigateSeason(-1));
    nextSeasonBtn.addEventListener('click', () => navigateSeason(1));

    // Preset Filter Button Logic
    document.querySelectorAll('.preset-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (!currentUser) return;
            const minMembersVal = button.dataset.minMembers;
            const maxMembersVal = button.dataset.maxMembers;
            const minScoreVal = button.dataset.minScore;
            const maxScoreVal = button.dataset.maxScore;

            if (minMembersVal !== undefined) minMembers.value = minMembersVal;
            if (maxMembersVal !== undefined) maxMembers.value = maxMembersVal;
            if (minScoreVal !== undefined) minScore.value = minScoreVal;
            if (maxScoreVal !== undefined) maxScore.value = maxScoreVal;
            
            applyFilters();
        });
    });
    
    // --- Fallback Copy Function ---
    function copyTitleToClipboard(text, buttonElement) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                const originalText = buttonElement.textContent;
                buttonElement.textContent = 'Copied!';
                buttonElement.disabled = true;
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                    buttonElement.disabled = false;
                }, 1500);
            }).catch(err => {
                console.error('Async: Could not copy text: ', err);
                fallbackCopyTextToClipboard(text, buttonElement); 
            });
        } else {
            fallbackCopyTextToClipboard(text, buttonElement); 
        }
    }

    function fallbackCopyTextToClipboard(text, buttonElement) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; 
        textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus(); textArea.select();
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                const originalText = buttonElement.textContent;
                buttonElement.textContent = 'Copied!'; buttonElement.disabled = true;
                setTimeout(() => { buttonElement.textContent = originalText; buttonElement.disabled = false; }, 1500);
            } else {
                alert('Fallback: Failed to copy title.');
            }
        } catch (err) {
            alert('Fallback: Error copying title.');
        }
        document.body.removeChild(textArea);
    }

    // --- Initialization ---
    async function initializeApp() {
        if (!db || !auth) { 
            console.warn("DB or Auth not available, app initialization incomplete.");
            authStatusSpan.textContent = 'Firebase connection error.';
            emptyListMessage.textContent = 'Firebase connection error. Data cannot be loaded.';
            emptyListMessage.classList.remove('hidden');
            enableAppFeatures(false); 
            return;
        }
        
        switchMode('hidden'); 
        populateGenreFilter(); 
        populateThemeFilter();
        enableAppFeatures(false); 
        authStatusSpan.textContent = "Checking login status...";
        emptyListMessage.textContent = 'Checking login status...';
        emptyListMessage.classList.remove('hidden');
    }

    initializeApp();

    // Selection and bulk action elements
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const addSelectedBtn = document.getElementById('addSelectedBtn');
    const removeSelectedBtn = document.getElementById('removeSelectedBtn');
    
    // Event listeners for select-all and bulk actions
    selectAllCheckbox?.addEventListener('change', () => {
        document.querySelectorAll('.row-select-checkbox').forEach(cb => {
            cb.checked = selectAllCheckbox.checked;
        });
    });
    deleteSelectedBtn?.addEventListener('click', deleteSelected);
    addSelectedBtn?.addEventListener('click', () => updateSelectedAddedStatus(true));
    removeSelectedBtn?.addEventListener('click', () => updateSelectedAddedStatus(false));
    
    // Helper functions for bulk actions
    function onRowSelectChange() {
        const all = document.querySelectorAll('.row-select-checkbox');
        const checked = document.querySelectorAll('.row-select-checkbox:checked');
        selectAllCheckbox.indeterminate = checked.length > 0 && checked.length < all.length;
        selectAllCheckbox.checked = checked.length === all.length;
    }

    function getSelectedMalIds() {
        return Array.from(document.querySelectorAll('.row-select-checkbox:checked'))
            .map(cb => parseInt(cb.dataset.malId, 10));
    }

    async function deleteSelected() {
        const ids = getSelectedMalIds();
        if (ids.length === 0) { alert('No anime selected.'); return; }
        if (!confirm(`Are you sure you want to delete ${ids.length} selected anime?`)) return;
        for (const malId of ids) {
            await deleteAnimeFromFirebase(malId);
            animeList = animeList.filter(a => a.mal_id !== malId);
        }
        applyFilters();
    }

    async function updateSelectedAddedStatus(setAdded) {
        const ids = getSelectedMalIds();
        if (ids.length === 0) { alert('No anime selected.'); return; }
        for (const malId of ids) {
            const index = animeList.findIndex(a => a.mal_id === malId);
            if (index !== -1) {
                animeList[index].added = setAdded;
                await updateAnimeInFirebase(malId, { added: setAdded });
            }
        }
        applyFilters();
    }
});

