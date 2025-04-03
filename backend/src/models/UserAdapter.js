// UserAdapter.js - Un adattatore che sostituisce bcrypt per l'autenticazione
const crypto = require('crypto');
const User = require('./User');

class UserAdapter {
  /**
   * Genera un hash sicuro per la password senza dipendenze native
   * @param {string} password - La password in chiaro
   * @returns {string} - Hash della password con salt
   */
  static hashPassword(password) {
    // Genera un salt casuale
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Genera un hash sha256 della password con il salt
    const hash = crypto.pbkdf2Sync(
      password, 
      salt, 
      10000, // Numero di iterazioni
      64,    // Lunghezza dell'output in byte
      'sha512'
    ).toString('hex');
    
    // Restituisci salt e hash insieme
    return `${salt}:${hash}`;
  }
  
  /**
   * Verifica se una password corrisponde all'hash memorizzato
   * @param {string} password - Password in chiaro da verificare
   * @param {string} storedHash - Hash memorizzato nel formato salt:hash
   * @returns {boolean} - true se la password è corretta
   */
  static verifyPassword(password, storedHash) {
    // Estrai salt e hash dall'hash memorizzato
    const [salt, hash] = storedHash.split(':');
    
    // Genera hash della password fornita con lo stesso salt
    const calculatedHash = crypto.pbkdf2Sync(
      password,
      salt,
      10000,
      64,
      'sha512'
    ).toString('hex');
    
    // Confronta gli hash
    return calculatedHash === hash;
  }
  
  /**
   * Crea un nuovo utente
   * @param {Object} userData - Dati dell'utente
   * @returns {Promise<Object>} - Utente creato
   */
  static async createUser(userData) {
    try {
      // Verifica se l'utente esiste già
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('Email already in use');
      }
      
      // Crea un nuovo utente con hash della password
      const user = new User({
        email: userData.email,
        password: this.hashPassword(userData.password),
        name: userData.name,
        authProvider: 'local'
      });
      
      // Salva l'utente nel database
      await user.save();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  /**
   * Cerca un utente e verifica la password
   * @param {string} email - Email dell'utente
   * @param {string} password - Password in chiaro
   * @returns {Promise<Object>} - Utente trovato
   */
  static async findUserByCredentials(email, password) {
    try {
      // Trova utente per email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verifica provider di autenticazione
      if (user.authProvider !== 'local') {
        throw new Error(`This account uses ${user.authProvider} authentication`);
      }
      
      // Verifica password
      if (!this.verifyPassword(password, user.password)) {
        throw new Error('Invalid password');
      }
      
      // Aggiorna l'ultimo accesso
      user.lastLogin = Date.now();
      await user.save();
      
      return user;
    } catch (error) {
      console.error('Error finding user by credentials:', error);
      throw error;
    }
  }
}

module.exports = UserAdapter;