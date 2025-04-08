// Helper function to get current year
export const getCurrentYear = () => {
    return new Date().getFullYear()
  }
  
// Helper function to get years from current year to 2020
export const getYearOptions = () => {
    const currentYear = getCurrentYear()
    const years = []

    for (let year = currentYear; year >= 2020; year--) {
        years.push({ label: year.toString(), value: year.toString() })
    }

    return years
}