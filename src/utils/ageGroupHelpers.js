/**
 * Helper utilities for age group filtering and validation.
 */

function getEventAgeGroupType(eventAgeGroup) {
    if (['14-16', '16-18', 'teenager'].includes(eventAgeGroup)) {
        return 'teenager';
    }
    return 'adult';
}

function getAllowedEventAgeGroups(userAgeGroup) {
    if (userAgeGroup === 'teenager') {
        return ['14-16', '16-18', 'teenager'];
    }
    return ['18-21', '21-25', '25-30', '30+', 'adult'];
}

module.exports = {
    getEventAgeGroupType,
    getAllowedEventAgeGroups
};
