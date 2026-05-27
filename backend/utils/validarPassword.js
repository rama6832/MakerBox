function validarPassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 6) return false;
  if (password.length > 100) return false;
  if (/\s/.test(password)) return false;
  return true;
}

module.exports = validarPassword;