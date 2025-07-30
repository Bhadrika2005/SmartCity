import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  InputBase, 
  IconButton, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemButton,
  Typography,
  Collapse,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  FaSearch,
  FaRoute,
  FaClock,
  FaMapMarkerAlt,
  FaHistory,
  FaChevronRight,
  FaChevronDown,
  FaCar,
  FaBus,
  FaWalking,
  FaBicycle
} from 'react-icons/fa';

const SearchPanelContainer = styled(Paper)(({ theme }) => ({
  width: '360px',
  height: '100%',
  position: 'absolute',
  left: 0,
  top: 0,
  zIndex: 1000,
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
}));

const SearchBox = styled(Paper)(({ theme }) => ({
  padding: '8px 16px',
  display: 'flex',
  alignItems: 'center',
  margin: '16px',
  border: '1px solid #e0e0e0'
}));

const SearchResultItem = styled(ListItemButton)(({ theme }) => ({
  padding: '8px 16px',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  }
}));

const SearchPanel = ({ onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRouteOptions, setShowRouteOptions] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
      if (!apiKey) {
        throw new Error('API key is not configured');
      }

      const response = await fetch(
        https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${apiKey}&limit=5&countrySet=IN
      );

      if (!response.ok) {
        throw new Error(Search failed: ${response.statusText});
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
    handleSearch(value);
  };

  const handleResultClick = (result) => {
    if (result.position) {
      onLocationSelect({
        lat: result.position.lat,
        lng: result.position.lon,
        name: result.address.freeformAddress || result.poi?.name || 'Unknown location'
      });
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const transportModes = [
    { icon: <FaCar />, name: 'Driving', eta: '25 min' },
    { icon: <FaBus />, name: 'Transit', eta: '40 min' },
    { icon: <FaWalking />, name: 'Walking', eta: '2 hr 15 min' },
    { icon: <FaBicycle />, name: 'Cycling', eta: '55 min' }
  ];

  return (
    <SearchPanelContainer>
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}>
        <SearchBox elevation={0}>
          <InputBase
            placeholder="Search location..."
            fullWidth
            value={searchQuery}
            onChange={handleInputChange}
            InputProps={{
              endAdornment: loading && <CircularProgress size={20} />,
            }}
          />
          <IconButton type="submit" disabled={loading}>
            <FaSearch />
          </IconButton>
        </SearchBox>
      </form>

      {error && (
        <Box p={1} color="error.main">
          {error}
        </Box>
      )}

      <List>
        {searchResults.length > 0 && (
          <>
            <ListItem>
              <ListItemText primary="Search Results" />
            </ListItem>
            {searchResults.map((result, index) => (
              <SearchResultItem
                key={result-${index}}
                onClick={() => handleResultClick(result)}
              >
                <ListItemIcon>
                  <FaMapMarkerAlt />
                </ListItemIcon>
                <ListItemText
                  primary={result.poi?.name || result.address?.freeformAddress}
                  secondary={result.address?.freeformAddress}
                />
              </SearchResultItem>
            ))}
            <Divider />
          </>
        )}

        <ListItem>
          <ListItemButton onClick={() => setShowRouteOptions(!showRouteOptions)}>
            <ListItemIcon>
              <FaRoute />
            </ListItemIcon>
            <ListItemText primary="Routes" />
            {showRouteOptions ? <FaChevronDown /> : <FaChevronRight />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={showRouteOptions}>
          <List component="div" disablePadding>
            {transportModes.map((mode) => (
              <ListItem key={mode.name} sx={{ pl: 4 }}>
                <ListItemIcon>{mode.icon}</ListItemIcon>
                <ListItemText 
                  primary={mode.name}
                  secondary={mode.eta}
                />
              </ListItem>
            ))}
          </List>
        </Collapse>

        <Divider />

        <ListItem>
          <ListItemIcon>
            <FaClock />
          </ListItemIcon>
          <ListItemText 
            primary="Traffic Times"
            secondary="Best time to travel: 10:30 AM - 11:30 AM"
          />
        </ListItem>

        <Divider />

        <ListItem>
          <ListItemIcon>
            <FaHistory />
          </ListItemIcon>
          <ListItemText primary="Recent Searches" />
        </ListItem>
      </List>

      <Box sx={{ p: 2, mt: 'auto' }}>
        <Typography variant="subtitle2" color="textSecondary">
          Traffic Information
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Updated every 5 minutes
        </Typography>
      </Box>
    </SearchPanelContainer>
  );
};

export default SearchPanel;