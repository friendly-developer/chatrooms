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
const send404 = (response) => {
  response.writeHead(404, { 'Content-Type': 'text/plain' });
  response.write('Error 404 : resource not found.');
  response.end();
};

/**
 * Helper function to serve file data.
 * Function writes the appropriate HTTP headers and then
 * sends the contents of the file
 */
const sendFile = (response, filePath, fileContents) => {
  response.writeHead(200, {
    'Content-Type': mime.lookup(path.basename(filePath)),
  });
  response.end(fileContents);
};

/**
 * a helper function for providing data either from cache if available
 * else from disk and also caching in the process
 */
const serverStatic = (response, cache, absPath) => {
  // Check if file exists in cache memory
  if (cache[absPath]) {
    // Serve file from cache memorys
    sendFile(response, absPath, cache[absPath]);
  } else {
    // check if file exists
    fs.exists(absPath, (exists) => {
      if (exists) {
        fs.readFile(absPath, (err, data) => {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        });
      } else {
        send404(response);
      }
    });
  }
};

/**
 * Server Object which listens for request and provides appropriate
 * response using helper functions
 */
const server = http.createServer((request, response) => {
  let filePath = false;
  if (request.url == '/') {
    filePath = 'public/index.html';
  } else {
    filePath = `public${request.url}`;
  }
  const absPath = `./${filePath}`;
  serverStatic(response, cache, absPath);
});

server.listen(3000, () => {
  console.log('server just started on port 3000');
});
