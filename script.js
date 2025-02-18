// script.js

const ADMIN_USERNAME = "admin@krot.off";
const ADMIN_PASSWORD = "KROT";
const SONGS_PER_PAGE = 10; // Pagination limit

let loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
let userRole = localStorage.getItem('userRole');
let songs = JSON.parse(localStorage.getItem('songs') || '[]'); // Still used initially for compatibility, will be replaced by DB
let users = JSON.parse(localStorage.getItem('users') || '[]');
let artistProfiles = JSON.parse(localStorage.getItem('artistProfiles') || '[]');
let artistProfileRequests = JSON.parse(localStorage.getItem('artistProfileRequests') || '[]');
let likedSongs = JSON.parse(localStorage.getItem('likedSongs-' + loggedInUserEmail) || '[]'); // Liked songs per user


let currentPage = 1; // Pagination current page
let currentSearchQuery = ''; // Store current search query
let currentGenreFilter = ''; // Store current genre filter
let currentSortBy = 'default'; // Store current sort option

let db; // SQL.js database instance

document.addEventListener('DOMContentLoaded', () => {
    initDBAndLoad();
});

async function initDBAndLoad() {
    db = await initSqlJs({ wasmUrl: 'sql-wasm.wasm' }); // Adjust path if needed
    initDatabaseSchema();
    loadInitialData(); // This will also load songs from DB and update UI

    updateNavigation();
    showSection('register-listener');
    updatePaginationButtons();
}


// Email Validation (Permissive)
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


function showSection(sectionId) {
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';

    if (sectionId === 'songs') {
        loadSongsForPage(currentPage);
    }
    if (sectionId === 'admin' && userRole !== 'admin') {
        alert('Admin access only.');
        showSection('login');
        return;
    }
    if (sectionId === 'company-dashboard' && userRole !== 'company') {
        alert('Company dashboard access only.');
        showSection('login');
        return;
    }
    if (sectionId === 'company-dashboard') {
        showCompanySection('upload-song');
        loadCompanyArtistProfiles();
        loadCompanyArtistProfileRequests();
    }
    if (sectionId === 'admin') {
        showAdminSection('pending-companies');
        loadAdminSongs();
    }
    if (sectionId === 'profile') {
        loadUserProfile();
    }
}

function showCompanySection(companySectionId) {
    document.querySelectorAll('#company-content > section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(`company-${companySectionId}`).style.display = 'block';

    if (companySectionId === 'company-artist-profiles') {
        loadCompanyArtistProfiles();
    }
    if (companySectionId === 'company-artist-profile-requests') {
        loadCompanyArtistProfileRequests();
    }
}

function showAdminSection(adminSectionId) {
    document.querySelectorAll('#admin-content > section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(`admin-${adminSectionId}`).style.display = 'block';

    if (adminSectionId === 'pending-companies') {
        loadPendingCompanies();
    }
    if (adminSectionId === 'admin-songs') {
        loadAdminSongs();
    }
    if (adminSectionId === 'admin-users') {
        loadAdminUsers();
    }
    if (adminSectionId === 'admin-companies') {
        loadAdminCompanies();
    }
}


function updateNavigation() {
    const registerListenerLink = document.querySelector('nav ul li a[onclick="showSection(\'register-listener\')"]');
    const registerCompanyLink = document.querySelector('nav ul li a[onclick="showSection(\'register-company\')"]');
    const loginLinkElement = document.querySelector('nav ul li a[onclick="showSection(\'login\')"]');

    if (loggedInUserEmail) {
        document.getElementById('songs-link').style.display = 'inline';
        document.getElementById('logout-link').style.display = 'inline';
        document.getElementById('profile-link').style.display = 'inline';
        document.getElementById('company-dashboard-link').style.display = 'none';
        document.getElementById('admin-link').style.display = 'none';

        registerListenerLink.style.display = 'none';
        registerCompanyLink.style.display = 'none';
        loginLinkElement.style.display = 'none';


        if (userRole === 'company') {
            document.getElementById('company-dashboard-link').style.display = 'inline';
            document.getElementById('admin-link').style.display = 'none';
        } else if (userRole === 'admin') {
            document.getElementById('admin-link').style.display = 'inline';
            document.getElementById('company-dashboard-link').style.display = 'none';
        }

    } else {
        document.getElementById('songs-link').style.display = 'none';
        document.getElementById('logout-link').style.display = 'none';
        document.getElementById('admin-link').style.display = 'none';
        document.getElementById('company-dashboard-link').style.display = 'none';
        document.getElementById('profile-link').style.display = 'none';

        registerListenerLink.style.display = 'inline';
        registerCompanyLink.style.display = 'inline';
        loginLinkElement.style.display = 'inline';
    }
}


// Registration Handlers
document.getElementById('listener-register-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('listener-email').value;
    const password = document.getElementById('listener-password').value;

    if (!isValidEmail(email)) {
        alert('Invalid email format.');
        return;
    }
    registerUser(email, password, 'listener');
});

document.getElementById('company-register-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('company-email').value;
    const password = document.getElementById('company-password').value;
    const companyName = document.getElementById('company-name').value;

    if (!isValidEmail(email)) {
        alert('Invalid email format for company email.');
        return;
    }
    registerUser(email, password, 'company', companyName);
});


function registerUser(email, password, role, companyName = null) {
    if (!email || !password) {
        alert('Please fill in all fields.');
        return;
    }
    if (!isValidEmail(email)) {
        alert('Invalid email format.');
        return;
    }


    if (users.find(user => user.email === email)) {
        alert('Email already registered. Please use a different email.');
        return;
    }

    let registrationStatus = 'approved';
    if (role === 'company') {
        registrationStatus = 'pending';
    }

    const newUser = {
        email: email,
        password: password,
        role: role,
        companyName: companyName,
        registrationStatus: registrationStatus
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    // TODO: Save user to SQL.js database as well if needed for more robust user management

    if (role === 'company' && registrationStatus === 'pending') {
        document.getElementById('company-reg-status-message').style.display = 'block';
        alert('Company registration submitted for admin approval.');
        showSection('login');
    } else {
        alert(`Registered as ${role}! Please login.`);
        showSection('login');
        return;
    }
}


// Login Handler
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    login(email, password);
});

function login(email, password) {
    if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        loggedInUserEmail = email;
        userRole = 'admin';
        localStorage.setItem('loggedInUserEmail', loggedInUserEmail);
        localStorage.setItem('userRole', userRole);
        alert('Admin Login Successful!');
        updateNavigation();
        showSection('admin');
        return;
    }

    const user = users.find(user => user.email === email); // Still using localStorage users for simplicity

    if (user && user.password === password) {
        if (user.role === 'company' && user.registrationStatus !== 'approved') {
            alert('Your company registration is pending admin approval.');
            return;
        }

        loggedInUserEmail = email;
        userRole = user.role;
        localStorage.setItem('loggedInUserEmail', loggedInUserEmail);
        localStorage.setItem('userRole', userRole);
        alert('Login Successful!');
        updateNavigation();
        if (userRole === 'company') {
            showSection('company-dashboard');
        } else {
            showSection('songs');
        }
    } else {
        alert('Login failed. Invalid email or password.');
    }
}

function logout() {
    loggedInUserEmail = null;
    userRole = null;
    localStorage.removeItem('loggedInUserEmail');
    localStorage.removeItem('userRole');
    updateNavigation();
    showSection('login');
    alert('Logged out.');
}


// Song Upload Handler (Company Role) - Modified to save to SQL.js
document.getElementById('company-upload-form').addEventListener('submit', function(event) {
    event.preventDefault();
    if (userRole !== 'company') {
        alert('Only distribution companies can upload songs via dashboard.');
        return;
    }

    const title = document.getElementById('song-title').value;
    const artist = document.getElementById('artist-name').value;
    const genre = document.getElementById('song-genre').value;
    const audioFile = document.getElementById('audio-file').files[0]; // We'll handle audio file differently

    if (!title || !artist || !genre || !audioFile) { // audioFile is still checked for presence, but not directly saved to GitHub
        alert('Please fill in all song details and select an audio file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        // Audio data (e.target.result) is available here as Data URL if you wanted to process it client-side

        // **SQL.js Database Insertion**
        try {
            db.run(`
                INSERT INTO app_songs (title, artist, genre, audioSrc, uploadedBy)
                VALUES (?, ?, ?, ?, ?)
            `, [title, artist, genre, 'placeholder_audio_url', loggedInUserEmail]); // Still using placeholder for audioSrc

            console.log('Song metadata saved to SQL.js database.');
            loadSongsFromDatabase(); // Re-load songs from database to update UI
            loadCompanySongs(); // Update company song lists if needed
            alert('Song uploaded successfully (metadata saved)! Audio file is a placeholder in this demo.');
            document.getElementById('company-upload-form').reset();

        } catch (dbError) {
            console.error('Database error saving song:', dbError);
            alert('Error saving song metadata to database.');
        }
    };

    reader.onerror = function() {
        alert('Error reading audio file.');
    };

    reader.readAsDataURL(audioFile); // We still read the audio file, but primarily for potential client-side processing or validation in a more advanced scenario. For now, it's mainly to satisfy the file input requirement.
});


// Enhanced Song Loading and Display (with Pagination, Filtering, Sorting)

function loadSongsForPage(page) {
    currentPage = page;
    const songListDiv = document.getElementById('song-list');
    songListDiv.innerHTML = '';

    let filteredAndSortedSongs = getFilteredAndSortedSongsFromDatabase(); // Get data from SQL.js

    const startIndex = (page - 1) * SONGS_PER_PAGE;
    const endIndex = startIndex + SONGS_PER_PAGE;
    const paginatedSongs = filteredAndSortedSongs.slice(startIndex, endIndex);


    if (paginatedSongs.length === 0) {
        songListDiv.innerHTML = '<p>No songs available for this page.</p>';
        updatePaginationButtons();
        return;
    }

    paginatedSongs.forEach(song => {
        const songItem = createSongItemElement(song);
        songListDiv.appendChild(songItem);
    });

    updatePaginationButtons();
    updatePageNumberDisplay();
}


function getFilteredAndSortedSongsFromDatabase() {
    let filteredSongs = [];
    let sqlQuery = "SELECT * FROM app_songs"; // Base query

    let whereClauses = [];
    let queryParams = [];

    if (currentGenreFilter && currentGenreFilter !== '') {
        whereClauses.push("genre = ?");
        queryParams.push(currentGenreFilter);
    }

    if (currentSearchQuery && currentSearchQuery !== '') {
        const searchQueryClause = "(title LIKE '%' || ? || '%' OR artist LIKE '%' || ? || '%')";
        whereClauses.push(searchQueryClause);
        queryParams.push(currentSearchQuery, currentSearchQuery); // Parameter for both title and artist
    }

    if (currentSortBy !== 'default') {
        sqlQuery += ` ORDER BY ${currentSortBy}`;
    }


    try {
        const results = db.exec(sqlQuery, queryParams);
        if (results.length > 0 && results[0].values) {
            filteredSongs = results[0].values.map(row => {
                const song = {};
                results[0].columns.forEach((column, index) => {
                    song[column] = row[index];
                });
                return song;
            });
        }
    } catch (dbError) {
        console.error("Database query error:", dbError, sqlQuery, queryParams);
        alert('Error fetching songs from database.');
        return []; // Return empty array in case of error
    }

    return filteredSongs;
}


// Function to initially load songs from the database when the page loads
function loadSongsFromDatabase() {
    songs = getFilteredAndSortedSongsFromDatabase(); // Load all songs initially
    localStorage.setItem('songs', JSON.stringify(songs)); // Update localStorage for compatibility (TEMPORARY - consider removing later)
    loadSongsForPage(currentPage); // Load songs for the current page
    loadPopularSongs();
    loadRecentSongs();
}


// Modify loadInitialData to load initial songs into SQL.js (if you have any starter songs)
function loadInitialData() {
    console.log("Loading initial data into SQL.js database.");

    // **Example: Insert some initial songs (replace with your actual data)**
    const initialSongs = [
        { title: "Song One", artist: "Artist A", genre: "Pop", audioSrc: "placeholder1", uploadedBy: "company1@example.com" },
        { title: "Song Two", artist: "Artist B", genre: "Rock", audioSrc: "placeholder2", uploadedBy: "company2@example.com" },
        { title: "Song Three", artist: "Artist C", genre: "Jazz", audioSrc: "placeholder3", uploadedBy: "company1@example.com" }
    ];

    try {
        initialSongs.forEach(song => {
            db.run(`
                INSERT INTO app_songs (title, artist, genre, audioSrc, uploadedBy)
                VALUES (?, ?, ?, ?, ?)
            `, [song.title, song.artist, song.genre, song.audioSrc, song.uploadedBy]);
        });
        console.log("Initial songs loaded into database.");
        loadSongsFromDatabase(); // Load songs from database to populate UI after initial data load

    } catch (dbError) {
        console.error("Error loading initial songs into database:", dbError);
    }

    // ... (rest of your loadInitialData function if you have other initial data to load) ...
}


document.addEventListener('DOMContentLoaded', () => {
    initDBAndLoad();
});


// ... (rest of your script.js code - other functions like createSongItemElement, playSong, pagination, filters, sorts, admin functions, profile functions, etc. - these will mostly remain the same as they work with the `songs` array, which is now populated from the SQL.js database) ...


function createSongItemElement(song) {
    const songItem = document.createElement('div');
    songItem.classList.add('song-item');
    songItem.innerHTML = `
        <h3>${song.title}</h3>
        <p>Artist: <a href="#" onclick="showArtistProfilePage('${song.artist}')">${song.artist}</a></p>
        <div class="song-details">
            <p>Genre: ${song.genre}</p>
            <p>Duration: 3:30 (Placeholder)</p>
            <p>Company: <a href="#" onclick="showCompanyProfilePage('${getCompanyByEmail(song.uploadedBy)?.companyName || 'Unknown Company'}')">${getCompanyByEmail(song.uploadedBy)?.companyName || 'Unknown Company'}</a></p>
        </div>
        <button class="like-button" onclick="toggleLikeSong(${song.id})" data-song-id="${song.id}">
            ${isSongLiked(song.id) ? 'Liked' : 'Like'}
        </button>
    `;
    songItem.addEventListener('click', (event) => {
        if (!event.target.classList.contains('like-button') && event.target.tagName.toLowerCase() !== 'a') {
            playSong(song);
        }
    });
    return songItem;
}


let currentAudio;

function playSong(song) {
    const audioPlayer = document.getElementById('audio-player');
    const audioPlayerContainer = document.getElementById('audio-player-container');
    const currentSongInfoDiv = document.getElementById('current-song-info');

    if (currentAudio) {
        currentAudio.pause();
    }

    audioPlayer.src = song.audioSrc;
    audioPlayerContainer.style.display = 'block';
    audioPlayer.load();
    audioPlayer.play();
    currentAudio = audioPlayer;
    currentSongInfoDiv.textContent = `Now playing: ${song.title} by ${song.artist}`;
}


// Pagination Functions
function updatePaginationButtons() {
    const totalPages = Math.ceil(getFilteredAndSortedSongsFromDatabase().length / SONGS_PER_PAGE) || 1;
    document.getElementById('page-number').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

function updatePageNumberDisplay() {
    const totalPages = Math.ceil(getFilteredAndSortedSongsFromDatabase().length / SONGS_PER_PAGE) || 1;
    document.getElementById('page-number').textContent = `Page ${currentPage} of ${totalPages}`;
}


function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadSongsForPage(currentPage);
    }
}

function nextPage() {
    const totalPages = Math.ceil(getFilteredAndSortedSongsFromDatabase().length / SONGS_PER_PAGE) || 1;
    if (currentPage < totalPages) {
        currentPage++;
        loadSongsForPage(currentPage);
    }
}


function searchSongs() {
    currentSearchQuery = document.getElementById('search-query').value.toLowerCase();
    currentPage = 1;
    loadSongsForPage(currentPage);
    updatePaginationButtons();
}


document.getElementById('genre-filter').addEventListener('change', function() {
    currentGenreFilter = this.value;
    currentPage = 1;
    loadSongsForPage(currentPage);
    updatePaginationButtons();
});


document.getElementById('sort-by').addEventListener('change', function() {
    currentSortBy = this.value;
    currentPage = 1;
    loadSongsForPage(currentPage);
    updatePaginationButtons();
});


// Popular Songs
function loadPopularSongs() {
    const popularSongListDiv = document.getElementById('popular-song-list');
    popularSongListDiv.innerHTML = '';

    // Re-calculate popularity based on liked songs from localStorage (for now, consider migrating liked songs to DB later)
    const songPopularity = {};
    const currentSongs = getFilteredAndSortedSongsFromDatabase(); // Get songs from DB
    currentSongs.forEach(song => {
        songPopularity[song.id] = 0;
        users.forEach(user => {
            const userLikedSongs = JSON.parse(localStorage.getItem('likedSongs-' + user.email) || '[]');
            if (userLikedSongs.includes(song.id)) {
                songPopularity[song.id]++;
            }
        });
    });


    const sortedSongs = [...currentSongs].sort((a, b) => songPopularity[b.id] - songPopularity[a.id]);
    const popularSongsToShow = sortedSongs.slice(0, 5);

    if (popularSongsToShow.length === 0) {
        popularSongListDiv.innerHTML = '<p>No popular songs yet.</p>';
        return;
    }


    popularSongsToShow.forEach(song => {
        const songItem = createPopularSongItemElement(song);
        popularSongListDiv.appendChild(songItem);
    });
}


function createPopularSongItemElement(song) {
    const songItem = document.createElement('div');
    songItem.classList.add('song-item');
    songItem.innerHTML = `
        <h3>${song.title}</h3>
        <p>Artist: ${song.artist}</p>
    `;
    songItem.addEventListener('click', () => playSong(song));
    return songItem;
}


// Recently Uploaded Songs
function loadRecentSongs() {
    const recentSongListDiv = document.getElementById('recent-song-list');
    recentSongListDiv.innerHTML = '';

    const currentSongs = getFilteredAndSortedSongsFromDatabase(); // Get songs from DB
    const recentSongs = [...currentSongs].sort((a, b) => b.id - a.id);
    const recentSongsToShow = recentSongs.slice(0, 5);

    if (recentSongsToShow.length === 0) {
        recentSongListDiv.innerHTML = '<p>No recent songs yet.</p>';
        return;
    }

    recentSongsToShow.forEach(song => {
        const songItem = createRecentSongItemElement(song);
        recentSongListDiv.appendChild(songItem);
    });
}

function createRecentSongItemElement(song) {
    const songItem = document.createElement('div');
    songItem.classList.add('song-item');
    songItem.innerHTML = `
        <h3>${song.title}</h3>
        <p>Artist: ${song.artist}</p>
    `;
    songItem.addEventListener('click', () => playSong(song));
    return songItem;
}


// Like Song Feature
function toggleLikeSong(songId) {
    if (!loggedInUserEmail) {
        alert('You must be logged in to like songs.');
        showSection('login');
        return;
    }

    const songIdNum = Number(songId);

    if (isSongLiked(songIdNum)) {
        likedSongs = likedSongs.filter(id => id !== songIdNum);
    } else {
        likedSongs.push(songIdNum);
    }
    localStorage.setItem('likedSongs-' + loggedInUserEmail, JSON.stringify(likedSongs));
    loadSongsForPage(currentPage);
    loadPopularSongs();
    updateLikedSongsInProfile();
}


function isSongLiked(songId) {
    return loggedInUserEmail && likedSongs.includes(Number(songId));
}



// User Profile Section
function showSectionProfile() {
    showSection('profile');
    loadUserProfile();
}
document.getElementById('profile-link').addEventListener('click', showSectionProfile);


function loadUserProfile() {
    if (loggedInUserEmail) {
        document.getElementById('profile-email').textContent = loggedInUserEmail;
        document.getElementById('profile-role').textContent = userRole;
        updateLikedSongsInProfile();
    } else {
        alert('Not logged in.');
        showSection('login');
    }
}

function updateLikedSongsInProfile() {
    const likedSongListDiv = document.getElementById('liked-song-list');
    likedSongListDiv.innerHTML = '';

    if (likedSongs.length === 0) {
        likedSongListDiv.innerHTML = '<p>No liked songs yet.</p>';
        return;
    }

    const likedSongDetails = songs.filter(song => likedSongs.includes(song.id)); // Still using songs from localStorage for liked songs (migration needed)
    likedSongDetails.forEach(song => {
        const songItem = createLikedSongItemElement(song);
        likedSongListDiv.appendChild(songItem);
    });
}


function createLikedSongItemElement(song) {
    const songItem = document.createElement('div');
    songItem.classList.add('song-item');
    songItem.innerHTML = `
        <h3>${song.title}</h3>
        <p>Artist: ${song.artist}</p>
    `;
    songItem.addEventListener('click', () => playSong(song));
    return songItem;
}


// Artist Profile Page

function showArtistProfilePage(artistName) {
    const artistProfilePageSection = document.getElementById('artist-profile-page');
    const artistNameDisplay = document.getElementById('artist-profile-name-display');
    const artistBioDisplay = document.getElementById('artist-profile-bio-display');

    artistNameDisplay.textContent = artistName;

    artistBioDisplay.textContent = `Bio for ${artistName} will be displayed here. (Placeholder in this demo).`;

    showSection('artist-profile-page');
}


// Company Profile Page
function showCompanyProfilePage(companyName) {
    const companyProfilePageSection = document.getElementById('company-profile-page');
    const companyNameDisplay = document.getElementById('company-profile-name-display');
    const companySongCountDisplay = document.getElementById('company-profile-song-count');

    companyNameDisplay.textContent = companyName;

    const company = getCompanyByName(companyName);
    if (company) {
        // Count company songs from database
        let companySongsCount = 0;
        try {
            const results = db.exec("SELECT COUNT(*) AS songCount FROM app_songs WHERE uploadedBy = ?", [company.email]);
            if (results.length > 0 && results[0].values.length > 0) {
                companySongsCount = results[0].values[0][0]; // Get the count from the query result
            }
        } catch (dbError) {
            console.error("Database error fetching company song count:", dbError);
        }

        companySongCountDisplay.textContent = `Songs uploaded: ${companySongsCount}`;
    } else {
        companySongCountDisplay.textContent = 'Company profile not found.';
    }


    showSection('company-profile-page');
}


function getCompanyByName(companyName) {
    return users.find(user => user.role === 'company' && user.companyName === companyName);
}

function getCompanyByEmail(email) {
    return users.find(user => user.role === 'company' && user.email === email);
}


// Admin Panel Functions - (Keep Admin Panel Functions from previous response - adapt to DB later)
// Load Pending Companies for Admin Approval
function loadPendingCompanies() {
    const pendingCompanyListDiv = document.getElementById('pending-company-list');
    pendingCompanyListDiv.innerHTML = '';

    const pendingCompanies = users.filter(user => user.role === 'company' && user.registrationStatus === 'pending');

    if (pendingCompanies.length === 0) {
        pendingCompanyListDiv.innerHTML = '<p>No pending company registrations.</p>';
        return;
    }

    pendingCompanies.forEach(company => {
        const companyItem = document.createElement('div');
        companyItem.classList.add('company-item');
        companyItem.innerHTML = `
            <div class="company-details">
                <h3>${company.companyName}</h3>
                <p>Email: ${company.email}</p>
            </div>
            <div class="company-actions">
                <button onclick="approveCompany('${company.email}')">Approve</button>
                <button class="reject" onclick="rejectCompany('${company.email}')">Reject</button>
            </div>
        `;
        pendingCompanyListDiv.appendChild(companyItem);
    });
}


function approveCompany(companyEmail) {
    updateCompanyRegistrationStatus(companyEmail, 'approved');
}

function rejectCompany(companyEmail) {
    updateCompanyRegistrationStatus(companyEmail, 'rejected');
}

function updateCompanyRegistrationStatus(companyEmail, status) {
    users = users.map(user => {
        if (user.email === companyEmail) {
            user.registrationStatus = status;
        }
        return user;
    });
    localStorage.setItem('users', JSON.stringify(users));
    loadPendingCompanies();
    alert(`Company ${companyEmail} ${status === 'approved' ? 'approved' : 'rejected'}.`);
}


// Admin Song Management (load and delete) - in admin panel
function loadAdminSongs() {
    const adminSongListDiv = document.getElementById('admin-song-list');
    adminSongListDiv.innerHTML = '';

    const adminSongs = getFilteredAndSortedSongsFromDatabase(); // Load from DB

    if (adminSongs.length === 0) {
        adminSongListDiv.innerHTML = '<p>No songs available.</p>';
        return;
    }

    adminSongs.forEach(song => {
        const songItem = document.createElement('div');
        songItem.classList.add('song-item');
        songItem.innerHTML = `
            <h3>${song.title}</h3>
            <p>Artist: ${song.artist}</p>
            <p>Genre: ${song.genre}</p>
            <button onclick="deleteSong(${song.id})">Delete Song</button>
        `;
        adminSongListDiv.appendChild(songItem);
    });
}

function deleteSong(songId) {
    try {
        db.run("DELETE FROM app_songs WHERE id = ?", [songId]);
        console.log(`Song with ID ${songId} deleted from database.`);
        loadAdminSongs(); // Reload admin song list from DB
        loadSongsForPage(currentPage); // Reload song list for listener view
        alert('Song deleted.');
    } catch (dbError) {
        console.error('Database error deleting song:', dbError);
        alert('Error deleting song from database.');
    }
}


// Admin User Management
function loadAdminUsers() {
    const adminUserListDiv = document.getElementById('admin-user-list');
    adminUserListDiv.innerHTML = '';

    const listenerUsers = users.filter(user => user.role === 'listener');

    if (listenerUsers.length === 0) {
        adminUserListDiv.innerHTML = '<p>No listener users registered.</p>';
        return;
    }

    listenerUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.classList.add('company-item');
        userItem.innerHTML = `
            <div class="company-details">
                <p>Email: ${user.email}</p>
            </div>
            <div class="company-actions">
                <button class="reject" onclick="deleteUser('${user.email}')">Delete User</button>
            </div>
        `;
        adminUserListDiv.appendChild(userItem);
    });
}

function deleteUser(userEmail) {
    if (loggedInUserEmail === userEmail) {
        alert('Admin cannot delete their own account via this panel.');
        return;
    }
    users = users.filter(user => user.email !== userEmail); // Still using localStorage users for simplicity
    localStorage.setItem('users', JSON.stringify(users));
    loadAdminUsers();
    alert(`User ${userEmail} deleted.`);
}


// Admin Company Management
function loadAdminCompanies() {
    const adminCompanyListDiv = document.getElementById('admin-company-list');
    adminCompanyListDiv.innerHTML = '';

    const approvedCompanies = users.filter(user => user.role === 'company' && user.registrationStatus === 'approved');

    if (approvedCompanies.length === 0) {
        adminCompanyListDiv.innerHTML = '<p>No approved companies registered.</p>';
        return;
    }

    approvedCompanies.forEach(company => {
        const companyItem = document.createElement('div');
        companyItem.classList.add('company-item');
        companyItem.innerHTML = `
            <div class="company-details">
                <h3>${company.companyName}</h3>
                <p>Email: ${company.email}</p>
            </div>
            <div class="company-actions">
                <button class="reject" onclick="deleteCompanyAdminPanel('${company.email}')">Delete Company</button>
            </div>
        `;
        adminCompanyListDiv.appendChild(companyItem);
    });
}


function deleteCompanyAdminPanel(companyEmail) {
    users = users.filter(user => user.email !== companyEmail); // Still using localStorage users
    localStorage.setItem('users', JSON.stringify(users));

    // Delete company's songs from database
    try {
        db.run("DELETE FROM app_songs WHERE uploadedBy = ?", [companyEmail]);
        console.log(`Songs for company ${companyEmail} deleted from database.`);
    } catch (dbError) {
        console.error("Database error deleting company songs:", dbError);
        alert('Error deleting company songs from database.');
    }

    loadAdminCompanies();
    loadAdminSongs();
    loadSongsForPage(currentPage);
    alert(`Company ${companyEmail} and associated songs deleted.`);
}


// Company Dashboard Functions - (Keep Company Dashboard functions from previous responses)

// Artist Profile Management (Company Dashboard)
function loadCompanyArtistProfiles() {
    const companyArtistProfileListDiv = document.getElementById('company-artist-profile-list');
    companyArtistProfileListDiv.innerHTML = '';

    const companyCreatedProfiles = artistProfiles.filter(profile => profile.companyUsername === loggedInUserEmail);

    if (companyCreatedProfiles.length === 0) {
        companyArtistProfileListDiv.innerHTML = '<p>No artist profiles created yet.</p>';
        return;
    }

    companyCreatedProfiles.forEach(profile => {
        const profileItem = document.createElement('div');
        profileItem.classList.add('song-item');
        profileItem.innerHTML = `
            <h3>${profile.name}</h3>
            <p>Bio: ${profile.bio || 'No bio provided.'}</p>
            <button onclick="deleteArtistProfile(${profile.id})">Delete Profile</button>
        `;
        companyArtistProfileListDiv.appendChild(profileItem);
    });
}


document.getElementById('create-artist-profile-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const artistName = document.getElementById('artist-profile-name').value;
    const artistBio = document.getElementById('artist-profile-bio').value;

    if (!artistName) {
        alert('Artist name is required.');
        return;
    }

    const newProfile = {
        id: Date.now(),
        name: artistName,
        bio: artistBio,
        companyUsername: loggedInUserEmail
    };
    artistProfiles.push(newProfile); // Still using localStorage artistProfiles for simplicity
    localStorage.setItem('artistProfiles', JSON.stringify(artistProfiles));
    loadCompanyArtistProfiles();
    showCompanySection('artist-profiles');
    alert('Artist profile created!');
    document.getElementById('create-artist-profile-form').reset();
}


function deleteArtistProfile(profileId) {
    artistProfiles = artistProfiles.filter(profile => profile.id !== profileId); // Still using localStorage artistProfiles
    localStorage.setItem('artistProfiles', JSON.stringify(artistProfiles));
    loadCompanyArtistProfiles();
    alert('Artist profile deleted.');
}


// Artist Profile Request Management (Company Dashboard)
function loadCompanyArtistProfileRequests() {
    const requestListDiv = document.getElementById('company-artist-profile-request-list');
    requestListDiv.innerHTML = '';

    const companyRequests = artistProfileRequests.filter(req => req.companyUsernameToReview === loggedInUserEmail);

    if (companyRequests.length === 0) {
        requestListDiv.innerHTML = '<p>No artist profile requests pending.</p>';
        return;
    }

    companyRequests.forEach(request => {
        const requestItem = document.createElement('div');
        requestItem.classList.add('company-item');
        requestItem.innerHTML = `
            <div class="company-details">
                <h3>Request for: ${request.artistNameRequested}</h3>
                <p>Requested by: ${request.requestingUsername}</p>
            </div>
            <div class="company-actions">
                <button onclick="approveArtistProfileRequest(${request.id})">Approve</button>
                <button class="reject" onclick="rejectArtistProfileRequest(${request.id})">Reject</button>
            </div>
        `;
        requestListDiv.appendChild(requestItem);
    });
}


function approveArtistProfileRequest(requestId) {
    updateArtistProfileRequestStatus(requestId, 'approved');
}

function rejectArtistProfileRequest(requestId) {
    updateArtistProfileRequestStatus(requestId, 'rejected');
}


function updateArtistProfileRequestStatus(requestId, status) {
    artistProfileRequests = artistProfileRequests.map(request => { // Still using localStorage artistProfileRequests
        if (request.id === requestId) {
            request.status = status;
        }
        return request;
    });
    localStorage.setItem('artistProfileRequests', JSON.stringify(artistProfileRequests));
    loadCompanyArtistProfileRequests();
    alert(`Artist profile request ${status === 'approved' ? 'approved' : 'rejected'}.`);
}


// **Request Artist Profile Feature (Example)**
function requestArtistProfileClaim(artistName) {
    if (!loggedInUserEmail) {
        alert('You must be logged in to request an artist profile.');
        showSection('login');
        return;
    }

    const companies = users.filter(user => user.role === 'company' && user.registrationStatus === 'approved');
    if (companies.length === 0) {
        alert('No distribution companies available to handle artist profile requests.');
        return;
    }
    const companyToReview = companies[0];

    const newRequest = {
        id: Date.now(),
        artistNameRequested: artistName,
        requestingUsername: loggedInUserEmail,
        companyUsernameToReview: companyToReview.email,
        status: 'pending'
    };
    artistProfileRequests.push(newRequest); // Still using localStorage artistProfileRequests
    localStorage.setItem('artistProfileRequests', JSON.stringify(artistProfileRequests));
    alert(`Artist profile request for "${artistName}" submitted. It is being reviewed by a distribution company.`);
}


// SQL.js Database Initialization and Schema Setup
async function initSqlJs(config) {
    const sqljs = await initSqlJsModule(config);
    return new sqljs.Database();
}


function initDatabaseSchema() {
    // Example table creation (adapt to your needs)
    db.run("CREATE TABLE IF NOT EXISTS app_songs (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, artist TEXT, genre TEXT, audioSrc TEXT, uploadedBy TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS app_users (email TEXT PRIMARY KEY, password TEXT, role TEXT, companyName TEXT, registrationStatus TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS app_artistProfiles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, bio TEXT, companyUsername TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS app_artistProfileRequests (id INTEGER PRIMARY KEY AUTOINCREMENT, artistNameRequested TEXT, requestingUsername TEXT, companyUsernameToReview TEXT, status TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS app_likedSongs (userId TEXT, songId INTEGER, PRIMARY KEY (userId, songId))"); // Composite key
    console.log("Database schema initialized.");
}


// Function to load initial data (if needed) - Placeholder for now
function loadInitialData() {
    console.log("Loading initial data into SQL.js database.");

    // **Example: Insert some initial songs (replace with your actual data)**
    const initialSongs = [
        { title: "Song One", artist: "Artist A", genre: "Pop", audioSrc: "placeholder1", uploadedBy: "company1@example.com" },
        { title: "Song Two", artist: "Artist B", genre: "Rock", audioSrc: "placeholder2", uploadedBy: "company2@example.com" },
        { title: "Song Three", artist: "Artist C", genre: "Jazz", audioSrc: "placeholder3", uploadedBy: "company1@example.com" }
    ];

    try {
        initialSongs.forEach(song => {
            db.run(`
                INSERT INTO app_songs (title, artist, genre, audioSrc, uploadedBy)
                VALUES (?, ?, ?, ?, ?)
            `, [song.title, song.artist, song.genre, song.audioSrc, song.uploadedBy]);
        });
        console.log("Initial songs loaded into database.");
        loadSongsFromDatabase(); // Load songs from database to populate UI after initial data load

    } catch (dbError) {
        console.error("Error loading initial songs into database:", dbError);
    }

    async function initDBAndLoad() {
    console.log("initDBAndLoad function is being called!"); // <--- Add this line
    db = await initSqlJs({ wasmUrl: 'sql-wasm.wasm' }); // Adjust path if needed
    initDatabaseSchema();
    loadInitialData();
    updateNavigation();
    showSection('register-listener'); // <--- This line should show "register-listener" section initially
    updatePaginationButtons();
    }// This will also load songs from DB and update UI

    function showSection(sectionId) {
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none'; // This line hides ALL sections
    });
    document.getElementById(sectionId).style.display = 'block'; // This line shows the target section

    if (sectionId === 'songs') {
        loadSongsForPage(currentPage);
    }
    if (sectionId === 'admin' && userRole !== 'admin') {
        alert('Admin access only.');
        showSection('login');
        return;
    }
    if (sectionId === 'company-dashboard' && userRole !== 'company') {
        alert('Company dashboard access only.');
        showSection('login');
        return;
    }
    if (sectionId === 'company-dashboard') {
        showCompanySection('upload-song');
        loadCompanyArtistProfiles();
        loadCompanyArtistProfileRequests();
    }
    if (sectionId === 'admin') {
        showAdminSection('pending-companies');
        loadAdminSongs();
    }
    if (sectionId === 'profile') {
        loadUserProfile();
    }
}

    // ... (rest of your loadInitialData function if you 
