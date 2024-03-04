// Global variable to store selected filters
let selectedFilters = {};

// Function to open the filter modal
function openFilterModal() {
    const filterModal = document.getElementById('filter-modal');

    // Populate filter options and set checkbox states based on selected filters
    populateFilterOptions();
    setCheckboxStates();

    filterModal.style.display = 'block';

    // Check if filters are active and update Clear Filters button color
    updateClearFiltersButtonStyle();
}


// Function to close the filter modal
function closeFilterModal() {
    const filterModal = document.getElementById('filter-modal');
    filterModal.style.display = 'none';
}

// Function to set checkbox states based on selected filters
function setCheckboxStates() {
    const filterOptionsContainer = document.getElementById('filter-options');
    const checkboxes = filterOptionsContainer.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        const checkboxIdParts = checkbox.id.split('-');
        const key = checkboxIdParts[2];
        const value = checkboxIdParts.slice(3).join('-');

        if (key in selectedFilters && selectedFilters[key].includes(value)) {
            checkbox.checked = true;
            // Make the selected option bold and highlight it
            checkbox.nextElementSibling.style.fontWeight = 'bold';
            // Populate unique values if the checkbox is checked
            populateUniqueValues(key);
        } else {
            checkbox.checked = false;
            // Reset styles for unselected options
            checkbox.nextElementSibling.style.fontWeight = 'normal';
            checkbox.nextElementSibling.style.background = 'none';
        }
    });
}


// Function to populate filter options dynamically
function populateFilterOptions() {
    const filterOptionsContainer = document.getElementById('filter-options');
    filterOptionsContainer.innerHTML = '';

    // Get all unique keys from the JSON data
    const allKeys = getAllKeys(productsData.productDirectory);

    // Create an unordered list
    const list = document.createElement('ul');

    // Create checkboxes and labels for each key
    allKeys.forEach(key => {
        if (key !== 'Product' && key !== 'Group Alias' && key !== 'Prod. Category') {
            const listItem = document.createElement('li');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `filter-checkbox-${key}`;
            checkbox.addEventListener('change', () => populateUniqueValues(key));

            const label = document.createElement('label');
            label.innerHTML = key;
            label.setAttribute('for', `filter-checkbox-${key}`);

            listItem.appendChild(checkbox);
            listItem.appendChild(label);

            list.appendChild(listItem);
        }
    });

    // Append the unordered list to the filterOptionsContainer
    filterOptionsContainer.appendChild(list);
}


// Function to get all unique keys from JSON data
function getAllKeys(data) {
    const keysSet = new Set();

    data.forEach(item => {
        Object.keys(item).forEach(key => {
            keysSet.add(key);
        });
    });

    return Array.from(keysSet);
}

// Function to populate unique values for the selected key
function populateUniqueValues(selectedKey) {
    const filterOptionsContainer = document.getElementById('filter-options');
    const selectedCheckbox = document.getElementById(`filter-checkbox-${selectedKey}`);
    const selectedValues = selectedFilters[selectedKey] || [];

    // Find the container for the selected key
    let container = filterOptionsContainer.querySelector(`[data-filter-container="${selectedKey}"]`);

    // If container doesn't exist, create a new one
    if (!container) {
        container = document.createElement('div');
        container.setAttribute('data-filter-container', selectedKey);
        filterOptionsContainer.appendChild(container);
    }

    // Clear existing checkboxes and labels for the selected key
    container.innerHTML = '';

    if (selectedCheckbox.checked) {
        // Get all unique values for the selected key
        const uniqueValues = getUniqueValues(productsData.productDirectory, selectedKey);

        // Create checkboxes and labels for each unique value
        uniqueValues.forEach(value => {
            const valueCheckbox = document.createElement('input');
            valueCheckbox.type = 'checkbox';
            valueCheckbox.id = `filter-checkbox-${selectedKey}-${value}`;

            // Set the checkbox state based on selectedFilters
            if (selectedValues.includes(value)) {
                valueCheckbox.checked = true;
            }

            const valueLabel = document.createElement('label');
            valueLabel.innerHTML = value;
            valueLabel.setAttribute('for', `filter-checkbox-${selectedKey}-${value}`);

            // Add an event listener to update selectedFilters on checkbox change
            valueCheckbox.addEventListener('change', () => updateSelectedFilters(selectedKey, value));

            container.appendChild(valueLabel);
            container.appendChild(valueCheckbox);
        });
    }
}



// Function to update selectedFilters on checkbox change
function updateSelectedFilters(selectedKey, selectedValue) {
    const checkbox = document.getElementById(`filter-checkbox-${selectedKey}-${selectedValue}`);

    if (checkbox.checked) {
        // Checkbox is checked, add the value to selectedFilters
        if (!(selectedKey in selectedFilters)) {
            selectedFilters[selectedKey] = [];
        }
        selectedFilters[selectedKey].push(selectedValue);
    } else {
        // Checkbox is unchecked, remove the value from selectedFilters
        selectedFilters[selectedKey] = selectedFilters[selectedKey].filter(value => value !== selectedValue);
    }
}




// Function to get all unique values for a selected key
function getUniqueValues(data, selectedKey) {
    const valuesSet = new Set();

    data.forEach(item => {
        if (selectedKey in item) {
            valuesSet.add(item[selectedKey]);
        }
    });

    return Array.from(valuesSet);
}

// Function to apply filters
function applyFilters() {
    // Update selectedFilters when applying filters
    selectedFilters = getSelectedFilters();

     // Check if filters are active and update Clear Filters button color
     updateClearFiltersButtonStyle();

    // Check if no filters are selected, clear filters and display all products
    if (Object.keys(selectedFilters).length === 0) {
        clearFilters();
        displayProducts(productsData.productDirectory);
        return;
    }

    // Implement filtering logic based on selectedFilters
    const filteredProducts = filterProductsBySelectedFilters(selectedFilters);

    // Update the product list with the filtered products
    displayProducts(filteredProducts);

    // Close the filter modal after applying filters
    closeFilterModal();
}

// Function to clear filters
function clearFilters() {
    // Clear selectedFilters when clearing filters
    selectedFilters = {};

    const filterOptionsContainer = document.getElementById('filter-options');
    const checkboxes = filterOptionsContainer.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // Remove dynamically created checkboxes
    filterOptionsContainer.innerHTML = '';

    // Reset the product list to show all products
    displayProducts(productsData.productDirectory);

    // Update Clear Filters button style
    updateClearFiltersButtonStyle();
}

// Function to filter products based on selected filters
function filterProductsBySelectedFilters(filters) {
    return productsData.productDirectory.filter(product => {
        for (const key in filters) {
            if (!filters[key].includes(String(product[key]))) {
                return false;
            }
        }
        return true;
    });
}

// Function to get selected filters
function getSelectedFilters() {
    const filterOptionsContainer = document.getElementById('filter-options');
    const checkboxes = filterOptionsContainer.querySelectorAll('input[type="checkbox"]');
    const selectedFilters = {};

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const checkboxIdParts = checkbox.id.split('-');
            const key = checkboxIdParts[2];
            const value = checkboxIdParts.slice(3).join('-');

            if (!(key in selectedFilters)) {
                selectedFilters[key] = [];
            }

            selectedFilters[key].push(value);
        }
    });

    return selectedFilters;
}

// Function to update Clear Filters button style based on filter activity
function updateClearFiltersButtonStyle() {
    const filterButton = document.getElementById('filterProductList');
    const clearFiltersButton = document.getElementById('clearFilters');
    const filtersActive = Object.keys(selectedFilters).length > 0;

    if (filtersActive) {
        filterButton.style.backgroundColor = 'darkblue';
        clearFiltersButton.style.backgroundColor = 'black';
        clearFiltersButton.style.color = 'white';
    } else {
        filterButton.style.backgroundColor = ''; // Reset to default
        clearFiltersButton.style.backgroundColor = ''; // Reset to default
        clearFiltersButton.style.color = ''; // Reset to default
    }
}