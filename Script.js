const { useState, useEffect, useRef } = React;
const { Container, Row, Col, Navbar, Nav, Button, Form, FormControl, ListGroup, Dropdown } = ReactBootstrap;

// --- Data (Move your musicLibraryData and playlists here) ---
const initialMusicLibraryData = [
    {
        id: "song1", title: "Song 1 Title", artist: "Artist 1 Name", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", albumArt: "album_art_1.jpg"
    },
    {
        id: "song2", title: "Song 2 Title", artist: "Artist 2 Name", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", albumArt: "album_art_2.jpg"
    },
    {
        id: "song3", title: "Song 3 Title", artist: "Artist 3 Name", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", albumArt: "album_art_3.jpg"
    },
    {
        id: "song4", title: "Another Song Title", artist: "Artist 1 Name", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", albumArt: "album_art_4.jpg"
    },
    {
        id: "song5", title: "Chill Song", artist: "Relaxing Artist", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", albumArt: "album_art_5.jpg"
    }
];

const initialPlaylists = {
    playlist1: [], workout: [], chill: []
};

// --- Components ---

const Header = ({ onLoginClick, onRegisterClick }) => (
    <Navbar bg="dark" variant="dark" className="py-3">
        <Container fluid className="d-flex justify-content-between align-items-center">
            <Navbar.Brand><i className="fas fa-music"></i> React Music App</Navbar.Brand>
            <div>
                <Button variant="outline-light" onClick={onLoginClick}>Login</Button>
                <Button variant="outline-light" className="ml-2" onClick={onRegisterClick}>Register</Button>
            </div>
        </Container>
    </Navbar>
);

const Sidebar = ({ musicLibrary, playlists, onPlaylistItemClick, onPlaylistLinkClick }) => (
    <Col md={3} className="bg-light sidebar">
        <div className="p-3">
            <h4><i className="fas fa-list"></i> Library</h4>
            <ListGroup variant="flush" id="music-library">
                {musicLibrary.map(song => (
                    <ListGroup.Item
                        key={song.id}
                        action
                        onClick={() => onPlaylistItemClick(song)}
                        className="library-item"
                    >
                        {song.title}
                    </ListGroup.Item>
                ))}
            </ListGroup>

            <hr className="my-3" />

            <h4><i className="fas fa-headphones"></i> Playlists</h4>
            <ListGroup variant="flush" id="playlists-list">
                {Object.keys(playlists).map(playlistId => (
                    <ListGroup.Item
                        key={playlistId}
                        action
                        onClick={(e) => { e.preventDefault(); onPlaylistLinkClick(playlistId); }}
                        className="playlist-link"
                        as="a"
                        href="#"
                        data-playlist-id={playlistId}
                    >
                        <i className="fas fa-list-music"></i> {playlistId.charAt(0).toUpperCase() + playlistId.slice(1)}
                    </ListGroup.Item>
                ))}
            </ListGroup>

            <hr className="my-3" />

            <h4><i className="fas fa-compass"></i> Explore (Placeholders)</h4>
            <ListGroup variant="flush">
                <ListGroup.Item action as="a" href="#">Genres (Placeholder)</ListGroup.Item>
                <ListGroup.Item action as="a" href="#">New Releases (Placeholder)</ListGroup.Item>
                <ListGroup.Item action as="a" href="#">Top Charts (Placeholder)</ListGroup.Item>
            </ListGroup>
        </div>
    </Col>
);

const NowPlayingSection = ({ currentSong }) => (
    <section className="mt-4 now-playing-section">
        <h3><i className="fas fa-headphones"></i> Now Playing</h3>
        <div id="now-playing-info" className="d-flex align-items-center">
            <div className="album-art-placeholder mr-3" id="album-art">
                {currentSong && currentSong.albumArt ?
                    <img src={currentSong.albumArt} alt="Album Art" style={{ width: '60px', height: '60px', borderRadius: '5px' }} />
                    : <i className="fas fa-compact-disc fa-3x"></i>}
            </div>
            <div id="song-details">
                <p id="song-title">{currentSong ? currentSong.title : "No song selected."}</p>
                <p id="artist-name">{currentSong ? currentSong.artist : "Select a song from the library or a playlist."}</p>
            </div>
        </div>
    </section>
);

const PlayQueueSection = ({ playQueue, onQueueItemClick }) => (
    <section className="mt-4 queue-section">
        <h3><i className="fas fa-list-ol"></i> Play Queue</h3>
        <ListGroup variant="flush" id="play-queue">
            {playQueue.map((song, index) => (
                <ListGroup.Item
                    key={index}
                    onClick={() => onQueueItemClick(index)}
                    action
                >
                    {`${song.title} - ${song.artist}`}
                </ListGroup.Item>
            ))}
        </ListGroup>
    </section>
);


const PlayerUI = ({ currentSong, onAddToPlaylist, playlistOptions, onRemoveFromPlaylist, playQueue, onQueueItemClick, audioPlayerRef }) => (
    <section className="player-ui">
        <NowPlayingSection currentSong={currentSong} />

        <div className="player-controls">
            <audio id="audio-player" controls ref={audioPlayerRef}></audio>
        </div>

        <div className="mt-3 playlist-controls">
            <Button variant="secondary" size="sm" id="add-to-playlist-btn" disabled={!currentSong} onClick={onAddToPlaylist}><i className="fas fa-plus"></i> Add to Playlist</Button>
            <Form.Select size="sm" className="d-inline-block w-auto ml-2" id="playlist-selector" disabled={!currentSong} value="" onChange={(e) => playlistOptions.setSelectedPlaylist(e.target.value)}>
                <option value="">-- Select Playlist --</option>
                {Object.keys(playlistOptions.playlists).map(playlistId => (
                    <option key={playlistId} value={playlistId}>{playlistId.charAt(0).toUpperCase() + playlistId.slice(1)}</option>
                ))}
            </Form.Select>
            <Button variant="danger" size="sm" className="ml-2" id="remove-from-playlist-btn" disabled={!currentSong} onClick={onRemoveFromPlaylist}><i className="fas fa-minus"></i> Remove from Playlist</Button>
        </div>

        <PlayQueueSection playQueue={playQueue} onQueueItemClick={onQueueItemClick} />
    </section>
);


const AuthArea = ({ onLoginClick, onRegisterClick }) => (
    <div id="auth-area">
        <h2>Welcome to the Music App!</h2>
        <p>Login or Register to access more features.</p>
        <div>
            <Button onClick={onLoginClick}>Login</Button>
            <Button variant="secondary" className="ml-2" onClick={onRegisterClick}>Register</Button>
        </div>
    </div>
);

const LoginForm = ({ onLogin, onCancel }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div id="login-form-area">
            <h2>Login</h2>
            <Form onSubmit={handleSubmit} id="login-form">
                <Form.Group className="mb-3" controlId="login-email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" placeholder="Enter email" required value={email} onChange={e => setEmail(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="login-password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
                </Form.Group>
                <Button variant="primary" type="submit">Login</Button>
                <Button variant="secondary" className="ml-2" onClick={onCancel}>Cancel</Button>
            </Form>
        </div>
    );
};


const RegisterForm = ({ onRegisterListenerClick, onRegisterCompanyClick, onCancel }) => (
    <div id="register-form-area">
        <h2>Register</h2>
        <div id="register-options">
            <Button onClick={onRegisterListenerClick}>Register as Listener</Button>
            <Button variant="secondary" className="ml-2" onClick={onRegisterCompanyClick}>Register as Company</Button>
            <Button variant="secondary" className="ml-2" onClick={onCancel}>Cancel</Button>
        </div>
    </div>
);

const ListenerRegisterForm = ({ onRegister, onCancel }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onRegister(email, password, 'listener');
    };

    return (
        <div id="listener-register-form">
            <h3>Listener Registration</h3>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="listener-email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" placeholder="Enter email" required value={email} onChange={e => setEmail(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="listener-password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
                </Form.Group>
                <Button variant="primary" type="submit">Register Listener</Button>
                <Button variant="secondary" className="ml-2" onClick={onCancel}>Back to Registration Options</Button>
            </Form>
        </div>
    );
};

const CompanyRegisterForm = ({ onRegister, onCancel }) => {
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onRegister(companyName, email, password, 'company');
    };


    return (
        <div id="company-register-form">
            <h3>Company Registration (Requires Admin Approval - Simulated)</h3>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="company-name">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control type="text" placeholder="Company Name" required value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="company-email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" placeholder="Enter email" required value={email} onChange={e => setEmail(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="company-password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
                </Form.Group>
                <Button variant="primary" type="submit">Register Company</Button>
                <Button variant="secondary" className="ml-2" onClick={onCancel}>Back to Registration Options</Button>
            </Form>
        </div>
    );
};

const CompanyPanelSidebar = ({ onLogout, onManageArtists, onViewReports, onCompanySettings }) => (
    <Col md={3} className="bg-light sidebar">
        <div className="p-3">
            <h4><i className="fas fa-building"></i> Company Panel</h4>
            <ListGroup variant="flush">
                <ListGroup.Item action onClick={onManageArtists}><i className="fas fa-users-artists"></i> Manage Artists</ListGroup.Item>
                <ListGroup.Item action onClick={onViewReports}><i className="fas fa-chart-bar"></i> View Reports</ListGroup.Item>
                <ListGroup.Item action onClick={onCompanySettings}><i className="fas fa-cog"></i> Settings</ListGroup.Item>
                <ListGroup.Item action onClick={onLogout}><i className="fas fa-sign-out-alt"></i> Logout Company</ListGroup.Item>
            </ListGroup>
        </div>
    </Col>
);

const CompanyPanelMain = ({ children }) => (
    <Col md={9} className="p-3">
        <div id="company-panel-main">
            <h2>Company Panel (Simulated)</h2>
            <p>Welcome to the Company Panel. Functionality here is simulated.</p>
            <div id="company-dashboard-content">
                {children}
            </div>
        </div>
    </Col>
);

const AdminPanelSidebar = ({ onLogout, onManageUsers, onApproveCompanies, onAdminSettings }) => (
    <Col md={3} className="bg-light sidebar">
        <div className="p-3">
            <h4><i className="fas fa-shield-alt"></i> Admin Panel</h4>
            <ListGroup variant="flush">
                <ListGroup.Item action onClick={onManageUsers}><i className="fas fa-user-cog"></i> Manage Users</ListGroup.Item>
                <ListGroup.Item action onClick={onApproveCompanies}><i className="fas fa-check-circle"></i> Approve Companies</ListGroup.Item>
                <ListGroup.Item action onClick={onAdminSettings}><i className="fas fa-cog"></i> Admin Settings</ListGroup.Item>
                <ListGroup.Item action onClick={onLogout}><i className="fas fa-sign-out-alt"></i> Logout Admin</ListGroup.Item>
            </ListGroup>
        </div>
    </Col>
);

const AdminPanelMain = ({ children }) => (
    <Col md={9} className="p-3">
        <div id="admin-panel-main">
            <h2>Admin Panel (Simulated)</h2>
            <p>Welcome to the Admin Panel. Functionality here is simulated.</p>
            <div id="admin-dashboard-content">
                {children}
            </div>
        </div>
    </Col>
);

const ManageUsersPanel = () => (
    <div id="manage-users-panel">
        <h3>Manage Users (Simulated Admin Feature)</h3>
        <p>User management actions would be here in a real application. This is just a placeholder.</p>
        <p>User list and management tools would be displayed here.</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => {/* Go Back to Admin Dashboard */ }}>Back to Admin Dashboard (Placeholder)</Button> {/* Placeholder for back button */}
    </div>
);


const ApproveCompaniesPanel = ({ pendingCompanies, onApproveCompany, onBackToDashboard }) => (
    <div id="approve-companies-panel">
        <h3>Approve Companies (Simulated Admin Feature)</h3>
        <p>List of companies awaiting approval.</p>
        <ListGroup variant="flush" id="pending-companies-list">
            {pendingCompanies.map(company => (
                <ListGroup.Item key={company.id} className="d-flex justify-content-between align-items-center">
                    {`${company.name} (${company.email})`}
                    <Button variant="success" size="sm" onClick={() => onApproveCompany(company.id)}>Approve</Button>
                </ListGroup.Item>
            ))}
        </ListGroup>
        <Button variant="secondary" size="sm" className="mt-2" onClick={onBackToDashboard}>Back to Admin Dashboard</Button>
    </div>
);

const AdminSettingsPanel = () => (
    <div id="admin-settings-panel">
        <h3>Admin Settings (Simulated Admin Feature)</h3>
        <p>Platform-wide settings management would be here. Setting changes would be simulated.</p>
        <p>Admin settings form/controls would be displayed here.</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => {/* Go Back to Admin Dashboard */ }}>Back to Admin Dashboard (Placeholder)</Button> {/* Placeholder for back button */}
    </div>
);


const SearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        onSearch(searchTerm);
    };

    return (
        <Form inline onSubmit={handleSearchSubmit} className="search-bar">
            <FormControl
                type="text"
                placeholder="Search music"
                className="mr-sm-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-light" className="ml-2" onClick={handleSearchSubmit}><i className="fas fa-search"></i></Button>
        </Form>
    );
};


const App = () => {
    const [musicLibrary, setMusicLibrary] = useState(initialMusicLibraryData);
    const [playlists, setPlaylists] = useState(() => {
        const storedPlaylists = localStorage.getItem('musicAppPlaylists');
        return storedPlaylists ? JSON.parse(storedPlaylists) : initialPlaylists;
    });
    const [playQueue, setPlayQueue] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    const [currentSong, setCurrentSong] = useState(null);
    const audioPlayerRef = useRef(null);
    const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true' || false);
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
    const [isCompanyApproved, setIsCompanyApproved] = useState(() => localStorage.getItem('isCompanyApproved') === 'true' || false);
    const [pendingCompanies, setPendingCompanies] = useState(() => {
        const storedPendingCompanies = localStorage.getItem('pendingCompanies');
        return storedPendingCompanies ? JSON.parse(storedPendingCompanies) : initialPendingCompanies;
    });
    const [approvedCompanies, setApprovedCompanies] = useState(() => {
        const storedApprovedCompanies = localStorage.getItem('approvedCompanies');
        return storedApprovedCompanies ? JSON.parse(storedApprovedCompanies) : [];
    });

    // UI State for Forms and Panels
    const [showAuth, setShowAuth] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showListenerRegister, setShowListenerRegister] = useState(false);
    const [showCompanyRegister, setShowCompanyRegister] = useState(false);
    const [showCompanyPanelUI, setShowCompanyPanelUI] = useState(false);
    const [showAdminPanelUI, setShowAdminPanelUI] = useState(false);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [showApproveCompanies, setShowApproveCompanies] = useState(false);
    const [showAdminSettings, setShowAdminSettings] = useState(false);


    // Simulated Admin Credentials
    const adminEmail = "admin@musicapp.com";
    const adminPassword = "adminpassword";


    // --- Local Storage Persistence (using useEffect) ---
    useEffect(() => {
        localStorage.setItem('isLoggedIn', isLoggedIn);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('isCompanyApproved', isCompanyApproved);
        localStorage.setItem('musicAppPlaylists', JSON.stringify(playlists));
        localStorage.setItem('pendingCompanies', JSON.stringify(pendingCompanies));
        localStorage.setItem('approvedCompanies', JSON.stringify(approvedCompanies));
    }, [isLoggedIn, userRole, isCompanyApproved, playlists, pendingCompanies, approvedCompanies]);


    // --- Music Playback Functions ---
    const loadMusicLibrary = (libraryData) => setMusicLibrary(libraryData);

    const updateNowPlaying = (song) => setCurrentSong(song);

    const addToQueue = (song) => {
        setPlayQueue(prevQueue => [...prevQueue, song]);
    };

    const updatePlayQueueUI = () => {}; // UI update is handled by React rendering queue
    };

    const playNextTrack = () => {
        if (playQueue.length > 0) {
            setCurrentTrackIndex(prevIndex => {
                let nextIndex = prevIndex + 1;
                if (nextIndex >= playQueue.length) {
                    nextIndex = 0; // Loop
                }
                const nextSong = playQueue[nextIndex];
                audioPlayerRef.current.src = nextSong.src;
                audioPlayerRef.current.load();
                audioPlayerRef.current.play();
                updateNowPlaying(nextSong);
                return nextIndex;
            });
        } else {
            audioPlayerRef.current.pause();
            setCurrentSong(null); // No song playing
        }
    };


    const handlePlaylistItemClick = (song) => {
        audioPlayerRef.current.src = song.src;
        audioPlayerRef.current.load();
        audioPlayerRef.current.play();
        updateNowPlaying(song);
        addToQueue(song);
        setCurrentTrackIndex(playQueue.length); // Index of last added track
    };


    const handleQueueItemClick = (index) => {
        if (index >= 0 && index < playQueue.length) {
            const selectedSong = playQueue[index];
            audioPlayerRef.current.src = selectedSong.src;
            audioPlayerRef.current.load();
            audioPlayerRef.current.play();
            updateNowPlaying(selectedSong);
            setCurrentTrackIndex(index);
        }
    };

    useEffect(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.addEventListener('ended', playNextTrack);
            return () => {
                if (audioPlayerRef.current) {
                    audioPlayerRef.current.removeEventListener('ended', playNextTrack);
                }
            };
        }
    }, [playQueue, currentTrackIndex]); // Effect dependency on playQueue and currentTrackIndex

    const handleSearch = (searchTerm) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const filteredLibrary = initialMusicLibraryData.filter(song =>
            song.title.toLowerCase().includes(lowerSearchTerm) || song.artist.toLowerCase().includes(lowerSearchTerm)
        );
        setMusicLibrary(filteredLibrary); // Update displayed library with filtered results
        if (searchTerm.trim() === "") {
            setMusicLibrary(initialMusicLibraryData); // Reset to full library if search is cleared
        }
    };

    const handleAddToPlaylist = () => {
        const selectedPlaylistId = playlistOptions.selectedPlaylist;
        if (selectedPlaylistId && currentSong) {
            if (!playlists[selectedPlaylistId].some(song => song.id === currentSong.id)) {
                setPlaylists(prevPlaylists => ({
                    ...prevPlaylists,
                    [selectedPlaylistId]: [...prevPlaylists[selectedPlaylistId], currentSong]
                }));
                alert(`Added "${currentSong.title}" to "${selectedPlaylistId}"`);
            } else {
                alert(`"${currentSong.title}" is already in "${selectedPlaylistId}"`);
            }
        } else {
            alert("Select a playlist and play a song first.");
        }
    };

    const handleRemoveFromPlaylist = () => {
        const selectedPlaylistId = playlistOptions.selectedPlaylist;
        if (selectedPlaylistId && currentSong) {
            const playlistSongs = playlists[selectedPlaylistId];
            const songIndexInPlaylist = playlistSongs.findIndex(song => song.id === currentSong.id);
            if (songIndexInPlaylist !== -1) {
                const updatedPlaylist = [...playlistSongs];
                updatedPlaylist.splice(songIndexInPlaylist, 1);
                setPlaylists(prevPlaylists => ({
                    ...prevPlaylists,
                    [selectedPlaylistId]: updatedPlaylist
                }));

                if (playQueue.length > 0 && currentPlaylistId === selectedPlaylistId) {
                     const updatedQueue = [...playQueue];
                     updatedQueue.splice(currentTrackIndex, 1);
                     setPlayQueue(updatedQueue);

                     if (updatedQueue.length > 0) {
                        if (currentTrackIndex >= updatedQueue.length) {
                            setCurrentTrackIndex(0);
                        }
                        const nextSong = updatedQueue[currentTrackIndex];
                        audioPlayerRef.current.src = nextSong.src;
                        audioPlayerRef.current.load();
                        audioPlayerRef.current.play();
                        updateNowPlaying(nextSong);
                     } else {
                        audioPlayerRef.current.pause();
                        setCurrentSong(null);
                        setCurrentTrackIndex(-1);
                     }
                }


                alert(`Removed "${currentSong.title}" from "${selectedPlaylistId}"`);
            } else {
                alert(`"${currentSong.title}" is not found in "${selectedPlaylistId}"`);
            }
        } else {
            alert("Select a playlist to remove from and play a song first.");
        }
    };


    const handlePlaylistLinkClick = (playlistId) => {
        if (playlists[playlistId] && playlists[playlistId].length > 0) {
            setPlayQueue([...playlists[playlistId]]);
            updatePlayQueueUI();
            setCurrentTrackIndex(0);
            const firstSongInPlaylist = playlists[playlistId][0];
            audioPlayerRef.current.src = firstSongInPlaylist.src;
            audioPlayerRef.current.load();
            audioPlayerRef.current.play();
            updateNowPlaying(firstSongInPlaylist);
            currentPlaylistId = playlistId; // Track current playlist
        } else {
            setPlayQueue([]);
            updatePlayQueueUI();
            audioPlayerRef.current.pause();
            setCurrentSong(null);
            setCurrentTrackIndex(-1);
            currentPlaylistId = null;
            alert(`Playlist "${playlistId}" is empty.`);
        }
    };


    // --- Authentication Handlers ---
    const handleLoginClick = () => { setShowAuth(false); setShowLogin(true); setShowRegister(false); setShowListenerRegister(false); setShowCompanyRegister(false); setShowCompanyPanelUI(false); setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); };
    const handleRegisterClick = () => { setShowAuth(false); setShowLogin(false); setShowRegister(true); setShowListenerRegister(false); setShowCompanyRegister(false); setShowCompanyPanelUI(false); setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); };
    const handleCancelRegister = () => { setShowAuth(true); setShowLogin(false); setShowRegister(false); setShowListenerRegister(false); setShowCompanyRegister(false); setShowCompanyPanelUI(false); setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); };
    const handleCancelLogin = () => { setShowAuth(true); setShowLogin(false); setShowRegister(false); setShowListenerRegister(false); setShowCompanyRegister(false); setShowCompanyPanelUI(false); setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); };
    const handleCancelListenerRegister = () => { setShowAuth(false); setShowLogin(false); setShowRegister(true); setShowListenerRegister(false); setShowCompanyRegister(false); setShowCompanyPanelUI(false); setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); };
    const handleCancelCompanyRegister = () => { setShowAuth(false); setShowLogin(false); setShowRegister(true); setShowListenerRegister(false); setShowCompanyRegister(false); setShowCompanyPanelUI(false); setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); };

    const handleRegister = (nameOrEmail, email, password, role) => {
        alert(`${role.charAt(0).toUpperCase() + role.slice(1)} Registered (Simulated): ${role === 'company' ? `Company Name: ${nameOrEmail}, ` : ''} Email: ${email}`);
        if (role === 'company') {
            setPendingCompanies(prevCompanies => [...prevCompanies, { name: nameOrEmail, email: email, id: `company-${prevCompanies.length + 1}` }]); // Simulate pending companies
        }
        setShowAuth(true); setShowLogin(false); setShowRegister(false); setShowListenerRegister(false); setShowCompanyRegister(false); setShowCompanyPanelUI(false); setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false);
    };


    const handleLogin = (email, password) => {
        if (email === adminEmail && password === adminPassword) {
            setIsLoggedIn(true);
            setUserRole('admin');
            setShowAdminPanelUI(true);
            setShowCompanyPanelUI(false);
            setShowAuth(false); setShowLogin(false); setShowRegister(false); setShowListenerRegister(false); setShowCompanyRegister(false); setShowManageUsers(false); setShowApproveCompanies(true); setShowAdminSettings(false); // Show Approve Companies Panel by default for admin login
        } else if (email.endsWith("@company.com")) {
            setIsLoggedIn(true);
            setUserRole('company');
            const isApproved = approvedCompanies.some(company => company.email === email);
            setIsCompanyApproved(isApproved);
            if (isApproved) {
                setShowCompanyPanelUI(true);
                setShowAdminPanelUI(false);
                setShowAuth(false); setShowLogin(false); setShowRegister(false); setShowListenerRegister(false); setShowCompanyRegister(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false);
                alert("Company Login Successful (Simulated - Approved)");
            } else {
                alert("Company Login (Simulated - Company Not Approved Yet)");
                setIsLoggedIn(false);
                setUserRole(null);
                setIsCompanyApproved(false);
                setShowAuth(true); setShowLogin(false); setShowRegister(false); setShowListenerRegister(false); setShowCompanyRegister(false); setShowCompanyPanelUI(false); setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false);
            }
        }
         else {
            setIsLoggedIn(true);
            setUserRole('listener');
            setShowCompanyPanelUI(false);
            setShowAdminPanelUI(false);
            setShowAuth(false); setShowLogin(false); setShowRegister(false); setShowListenerRegister(false); setShowCompanyRegister(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false);
             alert("Listener Login Successful (Simulated)");
        }
    };

    // --- Admin Panel Handlers ---
    const handleManageUsersClick = () => { setShowAdminPanelUI(false); setShowManageUsers(true); setShowApproveCompanies(false); setShowAdminSettings(false); };
    const handleApproveCompaniesClick = () => { setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(true); setShowAdminSettings(false); };
    const handleAdminSettingsClick = () => { setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(true); };
    const handleAdminLogout = () => { setIsLoggedIn(false); setUserRole(null); setShowAuth(true); setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); alert("Admin Logout (Simulated)"); };
    const handleApproveCompany = (companyId) => {
        const companyToApproveIndex = pendingCompanies.findIndex(company => company.id === companyId);
        if (companyToApproveIndex !== -1) {
            const companyToApprove = pendingCompanies[companyToApproveIndex];
            const updatedPendingCompanies = [...pendingCompanies];
            updatedPendingCompanies.splice(companyToApproveIndex, 1);
            setPendingCompanies(updatedPendingCompanies);
            setApprovedCompanies(prevApproved => [...prevApproved, companyToApprove]); // Add to approved companies
            alert(`Company "${companyToApprove.name}" Approved (Simulated)`);
        }
    };
    const handleBackToAdminDashboardFromUsers = () => { setShowAdminPanelUI(true); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); };
    const handleBackToAdminDashboardFromCompanies = () => { setShowAdminPanelUI(true); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); };
    const handleBackToAdminDashboardFromSettings = () => { setShowAdminPanelUI(true); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); };


    // --- Company Panel Handlers ---
    const handleManageArtistsClick = () => alert("Manage Artists (Simulated)");
    const handleViewReportsClick = () => alert("View Reports (Simulated)");
    const handleCompanySettingsClick = () => alert("Company Settings (Simulated)");
    const handleCompanyLogout = () => { setIsLoggedIn(false); setUserRole(null); setIsCompanyApproved(false); setShowAuth(true); setShowCompanyPanelUI(false); setShowAdminPanelUI(false); setShowManageUsers(false); setShowApproveCompanies(false); setShowAdminSettings(false); alert("Company Logout (Simulated)"); };


    // --- Playlist Options for PlayerUI ---
    const playlistOptions = {
        playlists: playlists,
        setSelectedPlaylist: null // Will be set below
    };
    playlistOptions.setSelectedPlaylist = useState('')[1]; // Initialize the setter from useState


    return (
        <Container fluid>
            <Header onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
            <Row>
                {isLoggedIn && userRole === 'company' && <CompanyPanelSidebar
                    onLogout={handleCompanyLogout}
                    onManageArtists={handleManageArtistsClick}
                    onViewReports={handleViewReportsClick}
                    onCompanySettings={handleCompanySettingsClick}
                />}
                {isLoggedIn && userRole === 'admin' && <AdminPanelSidebar
                    onLogout={handleAdminLogout}
                    onManageUsers={handleManageUsersClick}
                    onApproveCompanies={handleApproveCompaniesClick}
                    onAdminSettings={handleAdminSettingsClick}
                />}
                <Sidebar
                    musicLibrary={musicLibrary}
                    playlists={playlists}
                    onPlaylistItemClick={handlePlaylistItemClick}
                    onPlaylistLinkClick={handlePlaylistLinkClick}
                />
                <Col md={9} className="p-3">
                    <SearchBar onSearch={handleSearch} />
                    {showAuth && <AuthArea onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />}
                    {showLogin && <LoginForm onLogin={handleLogin} onCancel={handleCancelLogin} />}
                    {showRegister && <RegisterForm
                        onRegisterListenerClick={() => { setShowRegister(false); setShowListenerRegister(true); setShowCompanyRegister(false); }}
                        onRegisterCompanyClick={() => { setShowRegister(false); setShowListenerRegister(false); setShowCompanyRegister(true); }}
                        onCancel={handleCancelRegister}
                    />}
                    {showListenerRegister && <ListenerRegisterForm onRegister={handleRegister} onCancel={handleCancelListenerRegister} />}
                    {showCompanyRegister && <CompanyRegisterForm onRegister={handleRegister} onCancel={handleCancelCompanyRegister} />}

                    {isLoggedIn && !showCompanyPanelUI && !showAdminPanelUI && !showManageUsers && !showApproveCompanies && !showAdminSettings && (
                        <PlayerUI
                            currentSong={currentSong}
                            onAddToPlaylist={handleAddToPlaylist}
                            playlistOptions={playlistOptions}
                            onRemoveFromPlaylist={handleRemoveFromPlaylist}
                            playQueue={playQueue}
                            onQueueItemClick={handleQueueItemClick}
                            audioPlayerRef={audioPlayerRef}
                        />
                    )}

                    {showCompanyPanelUI && (
                        <CompanyPanelMain>
                            <p>Company Dashboard Content Placeholder using React Bootstrap.</p>
                            <ListGroup>
                                <ListGroup.Item action onClick={() => alert("Manage Artists (Simulated)")}>Manage Artists (Simulated)</ListGroup.Item>
                                <ListGroup.Item action onClick={() => alert("View Reports (Simulated)")}>View Reports (Simulated)</ListGroup.Item>
                                <ListGroup.Item action onClick={() => alert("Company Settings (Simulated)")}>Company Settings (Simulated)</ListGroup.Item>
                            </ListGroup>
                        </CompanyPanelMain>
                    )}

                    {showAdminPanelUI && (
                        <AdminPanelMain>
                            <p>Admin Dashboard Content Placeholder using React Bootstrap.</p>
                            <ListGroup>
                                <ListGroup.Item action onClick={handleManageUsersClick}>Manage Users (Simulated)</ListGroup.Item>
                                <ListGroup.Item action onClick={handleApproveCompaniesClick}>Approve Companies (Simulated)</ListGroup.Item>
                                <ListGroup.Item action onClick={handleAdminSettingsClick}>Admin Settings (Simulated)</ListGroup.Item>
                            </ListGroup>
                        </AdminPanelMain>
                    )}

                    {showManageUsers && <ManageUsersPanel />}
                    {showApproveCompanies && <ApproveCompaniesPanel pendingCompanies={pendingCompanies} onApproveCompany={handleApproveCompany} onBackToDashboard={handleBackToAdminDashboardFromCompanies} />}
                    {showAdminSettings && <AdminSettingsPanel />}

                </Col>
            </Row>
            <footer className="bg-dark text-white py-3 mt-4 fixed-bottom">
                <Container className="text-center">
                    <p>&copy; 2023 React CDN Enhanced Music App (Simulated)</p>
                </Container>
            </footer>
        </Container>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));
