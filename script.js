// script.js

const ADMIN_USERNAME = "Admin@KrotOfficial";
const ADMIN_PASSWORD = "KROT";
const SONGS_PER_PAGE = 10; // Pagination limit

let loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
let userRole = localStorage.getItem('userRole');
let songs = JSON.parse(localStorage.getItem('songs') || '[]');
let users = JSON.parse(localStorage.getItem('users') || '[]');
let artistProfiles = JSON.parse(localStorage.getItem('artistProfiles') || '[]');
let artistProfileRequests = JSON.parse(localStorage.getItem('artistProfileRequests') || '[]');
let likedSongs = JSON.parse(localStorage.getItem('likedSongs-' + loggedInUserEmail) || '[]'); // Liked songs per user


let currentPage = 1; // Pagination current page
let currentSearchQuery = ''; // Store current search query
let currentGenreFilter = ''; // Store current genre filter
let currentSortBy = 'default'; // Store current sort option


document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    loadSongsForPage(currentPage); // Load initial songs page
    loadPopularSongs(); // Load popular songs on initial load
    loadRecentSongs();   // Load recent songs on initial load
    showSection('register-listener');
    updatePaginationButtons();
});


// Email Validation (Very permissive -  virtually no restrictions)
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
        showSection('login'); // Or songs section, based on desired flow
        return;
    }
    if (sectionId === 'company-dashboard') {
        showCompanySection('upload-song'); // Default company dashboard section
        loadCompanyArtistProfiles();
        loadCompanyArtistProfileRequests(); // Load requests on dashboard view
    }
    if (sectionId === 'admin') {
        showAdminSection('pending-companies'); // Default admin section
        loadAdminSongs(); // Load songs in admin panel
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
        loadCompanyArtistProfiles(); // Reload artist profiles when section is shown
    }
    if (companySectionId === 'company-artist-profile-requests') {
        loadCompanyArtistProfileRequests(); // Reload requests when section is shown
    }
}

function showAdminSection(adminSectionId) {
    document.querySelectorAll('#admin-content > section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(`admin-${adminSectionId}`).style.display = 'block';

    if (adminSectionId === 'pending-companies') {
        loadPendingCompanies(); // Load pending companies when section is shown
    }
    if (adminSectionId === 'admin-songs') {
        loadAdminSongs(); // Reload admin song list
    }
}


function updateNavigation() {
    if (loggedInUserEmail) {
        document.getElementById('songs-link').style.display = 'inline';
        document.getElementById('logout-link').style.display = 'inline';
        document.getElementById('profile-link').style.display = 'inline';
        document.querySelectorAll('.auth-section').forEach(section => section.style.display = 'none');
        document.getElementById('login-link').style.display = 'none';

        if (userRole === 'company') {
            document.getElementById('company-dashboard-link').style.display = 'inline';
            document.getElementById('admin-link').style.display = 'none'; // Company user cannot see admin link
        } else if (userRole === 'admin') {
            document.getElementById('admin-link').style.display = 'inline';
            document.getElementById('company-dashboard-link').style.display = 'none'; // Admin cannot see company dashboard
        } else { // listener
            document.getElementById('company-dashboard-link').style.display = 'none';
            document.getElementById('admin-link').style.display = 'none';
        }

    } else {
        document.getElementById('songs-link').style.display = 'none';
        document.getElementById('logout-link').style.display = 'none';
        document.getElementById('admin-link').style.display = 'none';
        document.getElementById('company-dashboard-link').style.display = 'none';
        document.getElementById('profile-link').style.display = 'none';
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
    if (!isValidEmail(email)) { // Double check email validity
        alert('Invalid email format.');
        return;
    }


    if (users.find(user => user.email === email)) {
        alert('Email already registered. Please use a different email.');
        return;
    }

    let registrationStatus = 'approved'; // Default for listener, needs admin approval for company
    if (role === 'company') {
        registrationStatus = 'pending';
    }

    const newUser = {
        email: email,
        password: password, // In real app, hash this!
        role: role,
        companyName: companyName,
        registrationStatus: registrationStatus
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    if (role === 'company' && registrationStatus === 'pending') {
        document.getElementById('company-reg-status-message').style.display = 'block'; // Show pending message
        alert('Company registration submitted for admin approval.');
        showSection('login'); // Redirect to login after registration attempt
    } else {
        alert(`Registered as ${role}! Please login.`);
        showSection('login');
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

    const user = users.find(user => user.email === email);

    if (user && user.password === password) { // In real app, compare hashed passwords!
        if (user.role === 'company' && user.registrationStatus !== 'approved') {
            alert('Your company registration is pending admin approval.');
            return; // Do not log in if company is not approved
        }

        loggedInUserEmail = email;
        userRole = user.role;
        localStorage.setItem('loggedInUserEmail', loggedInUserEmail);
        localStorage.setItem('userRole', userRole);
        alert('Login Successful!');
        updateNavigation();
        if (userRole === 'company') {
            showSection('company-dashboard'); // Redirect company to dashboard
        } else {
            showSection('songs'); // Listener goes to songs
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


// Song Upload Handler (Company Role)
document.getElementById('company-upload-form').addEventListener('submit', function(event) {
    event.preventDefault();
    if (userRole !== 'company') {
        alert('Only distribution companies can upload songs via dashboard.');
        return;
    }

    const title = document.getElementById('song-title').value;
    const artist = document.getElementById('artist-name').value;
    const genre = document.getElementById('song-genre').value;
    const audioFile = document.getElementById('audio-file').files[0];

    if (!title || !artist || !genre || !audioFile) {
        alert('Please fill in all song details and select an audio file.');
        return;
    }


    const reader = new FileReader();
    reader.onload = function(e) {
        const songData = {
            id: Date.now(),
            title: title,
            artist: artist,
            genre: genre,
            audioSrc: 'placeholder_audio_url', // Placeholder
            uploadedBy: loggedInUserEmail // Track who uploaded (email)
        };

        songs.push(songData);
        localStorage.setItem('songs', JSON.stringify(songs));
        loadSongs(); // Refresh song list
        loadCompanySongs(); // Refresh company dashboard song list if needed (if you add song list to company dashboard)
        alert('Song uploaded successfully!');
        document.getElementById('company-upload-form').reset();
    };

    reader.onerror = function() {
        alert('Error reading audio file.');
    };

    reader.readAsDataURL(audioFile);
});


// Enhanced Song Loading and Display (with Pagination, Filtering, Sorting)

function loadSongsForPage(page) {
    currentPage = page;
    const songListDiv = document.getElementById('song-list');
    songListDiv.innerHTML = '';

    let filteredAndSortedSongs = getFilteredAndSortedSongs(); // Apply filters and sorting

    const startIndex = (page - 1) * SONGS_PER_PAGE;
    const endIndex = startIndex + SONGS_PER_PAGE;
    const paginatedSongs = filteredAndSortedSongs.slice(startIndex, endIndex);


    if (paginatedSongs.length === 0) {
        songListDiv.innerHTML = '<p>No songs available for this page.</p>';
        updatePaginationButtons(); // Update buttons even if no songs
        return;
    }

    paginatedSongs.forEach(song => {
        const songItem = createSongItemElement(song);
        songListDiv.appendChild(songItem);
    });

    updatePaginationButtons(); // Update pagination buttons after loading songs
    updatePageNumberDisplay();
}


function getFilteredAndSortedSongs() {
    let filteredSongs = [...songs]; // Start with a copy of all songs

    // Genre Filter
    if (currentGenreFilter && currentGenreFilter !== '') {
        filteredSongs = filteredSongs.filter(song => song.genre === currentGenreFilter);
    }

    // Search Filter
    if (currentSearchQuery && currentSearchQuery !== '') {
        const queryLower = currentSearchQuery.toLowerCase();
        filteredSongs = filteredSongs.filter(song =>
            song.title.toLowerCase().includes(queryLower) || song.artist.toLowerCase().includes(queryLower)
        );
    }

    // Sorting
    if (currentSortBy !== 'default') {
        filteredSongs.sort((a, b) => {
            let valueA = a[currentSortBy];
            let valueB = b[currentSortBy];

            if (typeof valueA === 'string') valueA = valueA.toLowerCase();
            if (typeof valueB === 'string') valueB = valueB.toLowerCase();


            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
        });
    }

    return filteredSongs;
}


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
            playSong(song); // Play song only if click is not on like button or artist/company link
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
    currentSongInfoDiv.textContent = `Now playing: ${song.title} by ${song.artist}`; // Display current song info
}


// Pagination Functions
function updatePaginationButtons() {
    const totalPages = Math.ceil(getFilteredAndSortedSongs().length / SONGS_PER_PAGE) || 1; // Ensure at least 1 page even if no songs
    document.getElementById('page-number').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

function updatePageNumberDisplay() {
    const totalPages = Math.ceil(getFilteredAndSortedSongs().length / SONGS_PER_PAGE) || 1;
    document.getElementById('page-number').textContent = `Page ${currentPage} of ${totalPages}`;
}


function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadSongsForPage(currentPage);
    }
}

function nextPage() {
    const totalPages = Math.ceil(getFilteredAndSortedSongs().length / SONGS_PER_PAGE) || 1;
    if (currentPage < totalPages) {
        currentPage++;
        loadSongsForPage(currentPage);
    }
}


// Search Songs - updated to trigger page reload and store query
function searchSongs() {
    currentSearchQuery = document.getElementById('search-query').value.toLowerCase();
    currentPage = 1; // Reset to first page on new search
    loadSongsForPage(currentPage);
    updatePaginationButtons();
}


// Genre Filter - Updated to trigger page reload and store filter
document.getElementById('genre-filter').addEventListener('change', function() {
    currentGenreFilter = this.value;
    currentPage = 1; // Reset to first page on new filter
    loadSongsForPage(currentPage);
    updatePaginationButtons();
});

// Sort By - Updated to trigger page reload and store sort option
document.getElementById('sort-by').addEventListener('change', function() {
    currentSortBy = this.value;
    currentPage = 1; // Reset to first page on new sort
    loadSongsForPage(currentPage);
    updatePaginationButtons();
});


// Popular Songs (Based on likes - simple demo implementation)
function loadPopularSongs() {
    const popularSongListDiv = document.getElementById('popular-song-list');
    popularSongListDiv.innerHTML = '';

    // Simple popularity calculation (count likes for each song)
    const songPopularity = {};
    songs.forEach(song => {
        songPopularity[song.id] = 0; // Initialize like count
        users.forEach(user => {
            const userLikedSongs = JSON.parse(localStorage.getItem('likedSongs-' + user.email) || '[]');
            if (userLikedSongs.includes(song.id)) {
                songPopularity[song.id]++;
            }
        });
    });

    // Sort songs by popularity (descending)
    const sortedSongs = [...songs].sort((a, b) => songPopularity[b.id] - songPopularity[a.id]);
    const popularSongsToShow = sortedSongs.slice(0, 5); // Show top 5 popular songs


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
    songItem.classList.add('song-item'); // Reusing song-item style
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

    // Sort songs by upload date (using song.id as timestamp - Date.now()) - newest first
    const recentSongs = [...songs].sort((a, b) => b.id - a.id);
    const recentSongsToShow = recentSongs.slice(0, 5); // Show top 5 recent songs

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
    songItem.classList.add('song-item'); // Reusing song-item style
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

    const songIdNum = Number(songId); // Ensure songId is a number

    if (isSongLiked(songIdNum)) {
        likedSongs = likedSongs.filter(id => id !== songIdNum); // Unlike
    } else {
        likedSongs.push(songIdNum); // Like
    }
    localStorage.setItem('likedSongs-' + loggedInUserEmail, JSON.stringify(likedSongs));
    loadSongsForPage(currentPage); // Re-render song list to update like button text
    loadPopularSongs(); // Re-render popular songs to update popularity
    updateLikedSongsInProfile(); // Update liked songs in profile, if profile is currently shown
}

