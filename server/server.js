const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const { promisify } = require('util');  // Import promisify from util module

const app = express();
const port = 8080; // Server running on http://localhost:8080

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: '136.232.92.230', // Ensure this host is correct and accessible
  port: 9090, // Ensure this port is correct
  user: 'vanilla',
  password: 'msu@123##',
  database: 'vanilla_db',
  connectionLimit: 10
});

// Promisify the pool.query method
const queryAsync = promisify(pool.query).bind(pool);

// Test the database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);  // Add detailed error logging
  } else {
    console.log('Database connected successfully!');
    connection.release();
  }
});

// Middleware
app.use(express.json()); // Handle JSON data
app.use(express.urlencoded({ extended: true })); // Handle URL-encoded data
app.use(cors()); // Enable CORS for frontend communication

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '..', 'public'))); // Adjust path

// Route to serve admin_index.html as the default page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin_index.html'), (err) => {
    if (err) {
      console.error('Error serving file:', err);
      res.status(404).send('File not found.');
    }
  });
});

// Route to add a department
app.post('/api/add-department', (req, res) => {
  const { departmentName } = req.body;

  if (!departmentName) {
    return res.status(400).send('Department name is required.');
  }

  // Check if department already exists
  const checkQuery = 'SELECT * FROM department WHERE department_name = ?';
  pool.query(checkQuery, [departmentName], (err, results) => {
    if (err) {
      console.error('Error checking department:', err);
      return res.status(500).send('Error checking department.');
    }

    if (results.length > 0) {
      return res.status(400).send('Department already exists.');
    }

    // Insert new department if it does not exist
    const insertQuery = 'INSERT INTO department (department_name) VALUES (?)';
    pool.query(insertQuery, [departmentName], (err, result) => {
      if (err) {
        console.error('Error inserting department:', err);
        return res.status(500).send('Error saving department.');
      }
      res.send('Department added successfully');
    });
  });
});

// Route to fetch all departments with department_id
app.get('/api/departments', (req, res) => {
  const query = 'SELECT department_id, department_name FROM department';

  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching departments:', err);
      return res.status(500).send('Error fetching departments.');
    }
    res.json(results);
  });
});
// Route to fetch department names along with department IDs for the dropdown
app.get('/api/department-names', (req, res) => {
  const query = 'SELECT department_id, department_name FROM department'; // Fetch department ID and name

  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching department names:', err.message, err.stack);
      return res.status(500).json({ message: 'Error fetching department names.' });
    }

    // Return an array of department objects containing department_id and department_name
    res.json(results);  // The frontend will handle this structure
  });
});


// Route to handle adding location
app.post('/api/add-location', (req, res) => {
  const { department_id, location_name } = req.body;  // Destructure department_id and location_name

  console.log('Request Body:', req.body); // Log request body for debugging

  // Validate if both department_id and location_name are provided
  if (!department_id || !location_name) {
    return res.status(400).json({ message: 'Please provide both department ID and location name.' });
  }

  // Insert query to add department_id and location_name to the database
  const query = 'INSERT INTO location (department_id, location_name) VALUES (?, ?)';
  
  console.log('SQL Query:', query); // Log SQL query for debugging
  console.log('Parameters:', [department_id, location_name]); // Log parameters for debugging

  pool.query(query, [department_id, location_name], (err, results) => {
    if (err) {
      console.error('Error inserting location:', err.message, err.stack);
      return res.status(500).json({ message: 'Error adding location to the database.' });
    }

    // Success response
    res.json({ message: 'Location added successfully!' });
  });
});

// Route to fetch all locations with location_id and location_name
app.get('/api/locations', (req, res) => {
  const query = `
    SELECT location.location_id, location.location_name, department.department_name
    FROM location
    JOIN department ON location.department_id = department.department_id
  `;

  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching location details:', err);
      return res.status(500).send('Error fetching locations.');
    }
    res.json(results); // Return the location data with department details
  });
});

// API endpoint to handle adding a room
app.post('/api/add-room', (req, res) => {
  const { roomNumber, roomType, departmentId, roomCapacity } = req.body;

  // Check if all fields are present
  if (!roomNumber || !roomType || !departmentId || !roomCapacity) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  // SQL query to insert the room data
  const query = 'INSERT INTO rooms (room_number, room_type, department_id, room_capacity) VALUES (?, ?, ?, ?)';

  // Execute the query
  db.query(query, [roomNumber, roomType, departmentId, roomCapacity], (err, result) => {
      if (err) {
          console.error('Error inserting room data:', err);
          return res.status(500).json({ success: false, message: 'Database error occurred.' });
      }

      res.status(200).json({ success: true, message: 'Room added successfully!' });
  });
});

// API to get department names for dynamic dropdown
app.get('/api/department-names', (req, res) => {
  const query = 'SELECT department_id, department_name FROM department';
  
  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching department names:', err);
          return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
      }

      res.status(200).json(results);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
