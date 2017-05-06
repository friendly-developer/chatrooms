const http = require('http'); // built in http module
const fs = require('fs');
// built in path module for filesystem and path related functionalities
const path = require('path');
// Add-on mime module to derive mime based extensions
const mime = require('mime');
// Object to store cached files
let cache = {};

/**
 * Helper function for handling 404 errors when a file is
 * requested that doesn't exist
 */
const send404 = (response) =>{
  response.writeHead(404, {'Content-Type':'text/plain'});
  response.write('Error 404 : resource not found.');
  response.end();
}

/**
 * Helper function to serve file data.
 * Function writes the appropriate HTTP headers and then
 * sends the contents of the file
 */
const sendFile = (response, filePath, fileContents) = {
  response.writeHead(200,
    {'Content-Type':mime.lookup(path.basename(filePath))}
  );
  response.end(fileContents);
}
