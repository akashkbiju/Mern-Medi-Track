/**
 * Sanitizes user document to ensure no sensitive internal data
 * (such as passwords, tokens, internal flags) is ever returned to the client.
 * 
 * @param {Object} user - Mongoose User document or plain object
 * @returns {Object} Safe sanitized user profile
 */
export const sanitizeUser = (user) => {
  if (!user) return null;

  const rawUser = typeof user.toObject === 'function' ? user.toObject() : user;

  return {
    id: (rawUser._id || rawUser.id).toString(),
    fullName: rawUser.fullName,
    email: rawUser.email,
    role: rawUser.role,
    phone: rawUser.phone || '',
    dateOfBirth: rawUser.dateOfBirth || null,
    gender: rawUser.gender || '',
    profileImage: rawUser.profileImage || '',
    emergencyContact: typeof rawUser.emergencyContact === 'object' && rawUser.emergencyContact !== null
      ? {
          name: rawUser.emergencyContact.name || '',
          relationship: rawUser.emergencyContact.relationship || '',
          phone: rawUser.emergencyContact.phone || '',
        }
      : {
          name: '',
          relationship: '',
          phone: typeof rawUser.emergencyContact === 'string' ? rawUser.emergencyContact : '',
        },
    createdAt: rawUser.createdAt,
    updatedAt: rawUser.updatedAt,
  };
};

export default sanitizeUser;
