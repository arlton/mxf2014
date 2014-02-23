var ApiResponse;
/**
 * Handles sending JSON response to client
 * @param  {object} res Expression engine response controller
 * @return {object}     
 */
ApiResponse = function(res) {
  this.send = function(code, data) {
    data = (typeof data === 'object') ? JSON.stringify(data) : data;
    res.writeHead(code, {'content-type':'application/json'});
    res.write(data);
    res.end();
  }

  return this;
};

module.exports = ApiResponse;