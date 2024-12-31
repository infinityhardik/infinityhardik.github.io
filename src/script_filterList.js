// Global variable to store selected filters
let selectedFilters = {};

// Function to open the filter modal
function openFilterModal() {
    // Populate filter options and set checkbox states based on selected filters
    populateFilterOptions();

    // Check if filters are active and update Clear Filters button color
    updateClearFiltersButtonStyle();
}

// Helper function 1
function getAllKeys(data) {
    const keys = new Set();
    data.forEach(item => {
        Object.keys(item).forEach(key => keys.add(key));
    });
    return Array.from(keys);
}

// Helper function 2
function getUniqueValues(data, key) {
    const values = new Set();
    data.forEach(item => {
        if (item[key]) values.add(item[key]);
    });
    return Array.from(values);
}



// Function to populate filter options dynamically
function populateFilterOptions() {
    const tabList = document.getElementById('list-tab');
    const tabContent = document.getElementById('nav-tabContent');
    tabList.innerHTML = '';
    tabContent.innerHTML = '';

    // Get all unique keys from the JSON data
    const allKeys = getAllKeys(productsData.productDirectory);

    // console.log('All Keys:', allKeys); 
    // Debugging: Log all keys

    // Create tabs and tab contents
    allKeys.forEach((key, index) => {
        if (key !== 'Product' && key !== 'Group Alias' && key !== 'Prod. Category') {
            const safeKey = key.replace(/ /g, '-'); // Replace spaces with hyphens
            // Create tab item
            const tabItem = document.createElement('a');
            tabItem.classList.add('list-group-item', 'list-group-item-action');
            if (index === 0) tabItem.classList.add('active');
            tabItem.id = `list-${safeKey}-list`;
            tabItem.setAttribute('data-bs-toggle', 'list');
            tabItem.href = `#list-${safeKey}`;
            tabItem.role = 'tab';
            tabItem.setAttribute('aria-controls', `list-${safeKey}`);
            tabItem.textContent = key;
            tabItem.addEventListener('click', () => populateUniqueValues(key));
            tabList.appendChild(tabItem);

            // Create tab content
            const tabPane = document.createElement('div');
            tabPane.classList.add('tab-pane', 'fade');
            if (index === 0) tabPane.classList.add('show', 'active');
            tabPane.id = `list-${safeKey}`;
            tabPane.role = 'tabpanel';
            tabPane.setAttribute('aria-labelledby', `list-${safeKey}-list`);
            tabContent.appendChild(tabPane);
        }
    });
}

// Function to populate unique values for the selected key
function populateUniqueValues(selectedKey) {
    const safeKey = selectedKey.replace(/ /g, '-'); // Replace spaces with hyphens
    const tabPane = document.getElementById(`list-${safeKey}`);
    tabPane.innerHTML = '';

    // Debugging: Log the key
    // console.log(`Populating values for: ${selectedKey}`); 

    // Get all unique values for the selected key
    const uniqueValues = getUniqueValues(productsData.productDirectory, selectedKey);

    // Debugging: Log unique values
    // console.log(`Unique values for ${selectedKey}:`, uniqueValues); 

    if (uniqueValues.length === 0) {
        console.warn(`No unique values found for key: ${selectedKey}`); // Debugging: Log warning if no values found
        return;
    }

    // Create checkboxes and labels for each unique value
    uniqueValues.forEach(value => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `filter-checkbox-${safeKey}-${value}`;
        checkbox.setAttribute('class', 'form-check-input me-1');
        checkbox.addEventListener('change', () => updateSelectedFilters(selectedKey, value));

        // Set checkbox state based on selectedFilters
        if (selectedFilters[selectedKey] && selectedFilters[selectedKey].includes(value)) {
            checkbox.checked = true;
        }

        const label = document.createElement('label');
        label.setAttribute('class', 'form-check-label');
        label.setAttribute('for', `filter-checkbox-${safeKey}-${value}`);
        label.textContent = value;

        const div = document.createElement('div');
        div.appendChild(checkbox);
        div.appendChild(label);

        tabPane.appendChild(div);
    });
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
            const keyIndex = checkboxIdParts.findIndex(part => part === 'checkbox'); // Find the index of 'checkbox'
            const key = checkboxIdParts.slice(keyIndex + 1, keyIndex + 3).join(' '); // Join the key parts with spaces
            const value = checkboxIdParts.slice(keyIndex + 3).join('-'); // Join remaining parts as value

            // console.log('Checkbox ID:', checkbox.id);
            // console.log('Key:', key);
            // console.log('Value:', value);

            if (!(key in selectedFilters)) {
                selectedFilters[key] = [];
            }

            selectedFilters[key].push(value);
        }
    });

    // console.log('Selected Filters:', selectedFilters);

    return selectedFilters;
}

// Function to update selected filters
function updateSelectedFilters(key, value) {
    if (!selectedFilters[key]) {
        selectedFilters[key] = [];
    }

    const index = selectedFilters[key].indexOf(value);
    if (index > -1) {
        selectedFilters[key].splice(index, 1);
    } else {
        selectedFilters[key].push(value);
    }

    updateClearFiltersButtonStyle();
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

    // Reset the product list to show all products
    displayProducts(productsData.productDirectory);

    // Update Clear Filters button style
    updateClearFiltersButtonStyle();
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