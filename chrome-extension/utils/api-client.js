/**
 * api-client.js - HTTP client for communicating with backend API
 */

class APIClient {
  /**
   * Get auth token from storage
   * @returns {Promise<string>} - Auth token or null
   */
  static async getAuthToken() {
    const token = await StorageAPI.get('authToken');
    return token || null;
  }
  
  /**
   * Make HTTP request to backend
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint path
   * @param {Object} body - Request body (for POST/PUT)
   * @returns {Promise<Object>} - Response JSON
   */
  static async request(method, endpoint, body = null) {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Not authenticated. Please log in to Social Media Automator.');
      }
      
      const url = `${CONSTANTS.API_BASE_URL}${endpoint}`;
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Extension': 'true'
      };
      
      const options = {
        method,
        headers
      };
      
      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }
      
      console.log(`📤 ${method} ${endpoint}`);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Clear auth token if unauthorized
          await StorageAPI.remove('authToken');
          throw new Error('Session expired. Please log in again.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${method} ${endpoint}`, data);
      
      return data;
      
    } catch (error) {
      console.error(`❌ API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }
  
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>}
   */
  static async get(endpoint) {
    return this.request('GET', endpoint);
  }
  
  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Object>}
   */
  static async post(endpoint, body) {
    return this.request('POST', endpoint, body);
  }
  
  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Object>}
   */
  static async put(endpoint, body) {
    return this.request('PUT', endpoint, body);
  }
  
  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>}
   */
  static async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
}
