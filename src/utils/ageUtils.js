/**
 * Utility module for Age Calculation and Safety Age Grouping
 * Find&Go Platform
 */

/**
 * Validates day, month, and year inputs for birth date.
 * @param {number|string} day - Day (1-31)
 * @param {number|string} month - Month (1-12)
 * @param {number|string} year - Year (e.g. 2004)
 * @returns {{ valid: boolean, birthday?: Date, dateString?: string, error?: string }}
 */
function parseAndValidateBirthday(day, month, year) {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y)) {
        return { valid: false, error: 'Укажите правильный день, месяц и год рождения' };
    }

    if (m < 1 || m > 12) {
        return { valid: false, error: 'Месяц рождения должен быть от 1 до 12' };
    }

    if (d < 1 || d > 31) {
        return { valid: false, error: 'День рождения должен быть от 1 до 31' };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    if (y < 1900 || y > currentYear) {
        return { valid: false, error: `Год рождения должен быть от 1900 до ${currentYear}` };
    }

    // Verify calendar validity of the date (e.g. leap years, Feb 30)
    const birthdayDate = new Date(y, m - 1, d);
    if (
        birthdayDate.getFullYear() !== y ||
        birthdayDate.getMonth() !== m - 1 ||
        birthdayDate.getDate() !== d
    ) {
        return { valid: false, error: 'Указана несуществующая дата рождения' };
    }

    // Cannot be in the future
    if (birthdayDate > today) {
        return { valid: false, error: 'Дата рождения не может быть в будущем' };
    }

    const pad = (n) => String(n).padStart(2, '0');
    const dateString = `${y}-${pad(m)}-${pad(d)}`;

    return { valid: true, birthday: birthdayDate, dateString };
}

/**
 * Server-only accurate age calculation in years.
 * @param {Date|string} birthday - Birth date (Date object or YYYY-MM-DD string)
 * @param {Date} [referenceDate] - Date relative to which age is calculated (defaults to now)
 * @returns {number} Age in full years
 */
function calculateAge(birthday, referenceDate = new Date()) {
    const birthDate = new Date(birthday);
    const ref = new Date(referenceDate);

    let age = ref.getFullYear() - birthDate.getFullYear();
    const monthDiff = ref.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Determines safety age group based on calculated age.
 * - 14-17 years: 'teenager'
 * - 18+ years: 'adult'
 * - < 14 years: invalid (registration prohibited)
 * @param {number} age - Calculated age in years
 * @returns {{ valid: boolean, ageGroup?: 'teenager' | 'adult', error?: string }}
 */
function determineAgeGroup(age) {
    if (typeof age !== 'number' || isNaN(age)) {
        return { valid: false, error: 'Некорректный возраст' };
    }

    if (age < 14) {
        return { valid: false, error: 'Регистрация на платформе доступна только с 14 лет' };
    }

    if (age >= 14 && age <= 17) {
        return { valid: true, ageGroup: 'teenager' };
    }

    return { valid: true, ageGroup: 'adult' };
}

/**
 * Extensible structure for future age verification via official documents (ID / Passport).
 * @param {Object} user - User record
 * @returns {Object} Extensible verification metadata
 */
function getVerificationStatus(user) {
    return {
        isAgeVerified: Boolean(user?.isAgeVerified),
        verificationStatus: user?.verificationStatus || 'unverified',
        ageGroup: user?.ageGroup || 'adult'
    };
}

module.exports = {
    parseAndValidateBirthday,
    calculateAge,
    determineAgeGroup,
    getVerificationStatus
};
