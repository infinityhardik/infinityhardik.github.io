// Global variable to store selected filters
let selectedFilters = {};

// Helper functions

/**
 * Retrieves all unique keys (property names) from an array of objects.
 * @param {Array<Object>} data - The array of objects to inspect.
 * @returns {Array<string>} An array of unique keys.
 */
function getAllKeys(data) {
    const keys = new Set();
    data.forEach(item => {
        Object.keys(item).forEach(key => keys.add(key));
    });
    return Array.from(keys);
}

/**
 * Retrieves all unique values for a specified key from an array of objects.
 * @param {Array<Object>} data - The array of objects to inspect.
 * @param {string} key - The key whose unique values are to be retrieved.
 * @returns {Array<string>} An array of unique values for the specified key.
 */
function getUniqueValues(data, key) {
    const values = new Set();
    data.forEach(item => {
        if (item[key]) values.add(String(item[key])); // Ensure values are stored as strings
    });
    return Array.from(values).sort(); // Sort values alphabetically
}

/**
 * Opens the filter modal and ensures filter options are populated and checkbox states are updated.
 */
function openFilterModal() {
    // Check if filter options need to be populated (e.g., first time opening the modal)
    const hasExistingOptions = document.querySelector('#list-tab button'); // Check if any tab buttons exist
    if (!hasExistingOptions && productsData.productDirectory.length > 0) {
        populateFilterOptions();
    }
    updateFilterCheckboxStates(); // Always update checkbox states when modal opens
}


/**
 * Populates the filter options in the modal based on product data.
 */
function populateFilterOptions() {
    const listTab = document.getElementById('list-tab');
    const navTabContent = document.getElementById('nav-tabContent');

    listTab.innerHTML = ''; // Clear existing tabs
    navTabContent.innerHTML = ''; // Clear existing tab content

    // Define the keys we want to create filters for and their display names
    const filterKeys = {
        'Product Type': 'Product Type',
        'Group Name': 'Group Name',
        'Prod. Category': 'Product Category',
        'Face Type': 'Face Type',
        'Core Type': 'Core Type',
        'Grade Type': 'Grade Type',
        'Brand Mark': 'Brand Mark'
    };

    let firstTab = true; // To mark the first tab as active

    for (const key in filterKeys) {
        const displayName = filterKeys[key];
        const uniqueValues = getUniqueValues(productsData.productDirectory, key);

        if (uniqueValues.length > 0) {
            // Create tab button
            const buttonId = `list-${key.replace(/\s/g, '-')}-list`; // e.g., list-Product-Type-list
            const tabPaneId = `${key.replace(/\s/g, '-')}-tab-pane`; // e.g., Product-Type-tab-pane

            const button = document.createElement('button');
            button.classList.add('list-group-item', 'list-group-item-action');
            if (firstTab) {
                button.classList.add('active');
                button.setAttribute('aria-current', 'true');
            }
            button.id = buttonId;
            button.dataset.bsToggle = 'list';
            button.href = `#${tabPaneId}`;
            button.role = 'tab';
            button.setAttribute('aria-controls', tabPaneId);
            button.textContent = displayName;
            listTab.appendChild(button);

            // Create tab pane content
            const tabPane = document.createElement('div');
            tabPane.classList.add('tab-pane', 'fade');
            if (firstTab) {
                tabPane.classList.add('show', 'active');
            }
            tabPane.id = tabPaneId;
            tabPane.role = 'tabpanel';
            tabPane.setAttribute('aria-labelledby', buttonId);

            uniqueValues.forEach(value => {
                const formCheck = document.createElement('div');
                formCheck.classList.add('form-check');

                const input = document.createElement('input');
                input.classList.add('form-check-input', 'filter-checkbox');
                input.type = 'checkbox';
                input.value = value;
                input.id = `filter-${key.replace(/\s/g, '-')}-${value.replace(/\s/g, '-')}`;
                input.dataset.filterKey = key; // Store the original key name

                const label = document.createElement('label');
                label.classList.add('form-check-label');
                label.htmlFor = input.id;
                label.textContent = value;

                formCheck.appendChild(input);
                formCheck.appendChild(label);
                tabPane.appendChild(formCheck);

                // Add event listener to update selectedFilters on change
                input.addEventListener('change', (event) => {
                    const filterKey = event.target.dataset.filterKey;
                    const filterValue = event.target.value;

                    if (event.target.checked) {
                        if (!selectedFilters[filterKey]) {
                            selectedFilters[filterKey] = [];
                        }
                        if (!selectedFilters[filterKey].includes(filterValue)) {
                            selectedFilters[filterKey].push(filterValue);
                        }
                    } else {
                        if (selectedFilters[filterKey]) {
                            selectedFilters[filterKey] = selectedFilters[filterKey].filter(val => val !== filterValue);
                            if (selectedFilters[filterKey].length === 0) {
                                delete selectedFilters[filterKey]; // Remove key if no values selected
                            }
                        }
                    }
                    updateClearFiltersButtonStyle(); // Update button style immediately
                });
            });
            navTabContent.appendChild(tabPane);
            firstTab = false; // Only the first one should be active initially
        }
    }
    updateClearFiltersButtonStyle(); // Initial update of button style after populating
}


/**
 * Updates the checked state of filter checkboxes based on `selectedFilters`.
 */
function updateFilterCheckboxStates() {
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        const filterKey = checkbox.dataset.filterKey;
        const filterValue = checkbox.value;
        checkbox.checked = selectedFilters[filterKey] && selectedFilters[filterKey].includes(filterValue);
    });
}

/**
 * Applies the selected filters to the product list and displays only matching products.
 */
function applyFilters() {
    let filteredProducts = productsData.productDirectory;

    // Iterate over each filter category (key) in selectedFilters
    for (const key in selectedFilters) {
        if (selectedFilters.hasOwnProperty(key) && selectedFilters[key].length > 0) {
            const filterValues = selectedFilters[key]; // Array of selected values for this category

            // Filter the products: Keep only products whose 'key' property value is
            // included in the 'filterValues' array for the current category.
            filteredProducts = filteredProducts.filter(product =>
                filterValues.includes(String(product[key]))
            );
        }
    }
    displayProducts(filteredProducts); // Display the filtered results
    resetFocus(); // Reset focus after filtering
}


/**
 * Clears all active filters, displays all products, and updates button styles.
 */
function clearFilters() {
    selectedFilters = {}; // Reset global selected filters object

    // Uncheck all filter checkboxes in the modal
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });

    displayProducts(productsData.productDirectory); // Display all original products
    updateClearFiltersButtonStyle(); // Reset button style
    resetFocus(); // Reset focus after clearing filters
    displayFeedbackMessage('Filters cleared. Showing all products.', 'success');
}


/**
 * Filters products based on selected filters.
 * @param {Object} filters - An object where keys are product properties (e.g., 'Product Type')
 * and values are arrays of selected filter values (e.g., ['Plywood', 'Block-Board']).
 * @returns {Array<Object>} An array of product objects that match all selected filters.
 */
function filterProductsBySelectedFilters(filters) {
    return productsData.productDirectory.filter(product => {
        for (const key in filters) {
            // Check if the product's value for this key is included in the selected filter values for that key
            if (filters.hasOwnProperty(key) && !filters[key].includes(String(product[key]))) {
                return false; // If any filter doesn't match, exclude the product
            }
        }
        return true; // If all filters match, include the product
    });
}

/**
 * Updates the visual style of the "Filter" and "Clear Filters" buttons
 * based on whether any filters are currently active.
 */
function updateClearFiltersButtonStyle() {
    const filterButton = document.getElementById('filterProductList');
    const clearFiltersButton = document.getElementById('clearFilters');
    // Check if there are any active filters
    const filtersActive = Object.keys(selectedFilters).length > 0;

    if (filtersActive) {
        filterButton.style.backgroundColor = 'darkblue'; // Indicate active filters
        clearFiltersButton.style.backgroundColor = 'black';
        clearFiltersButton.style.color = 'white';
    } else {
        // Reset to default Bootstrap styles or custom neutral styles
        filterButton.style.backgroundColor = '';
        clearFiltersButton.style.backgroundColor = '';
        clearFiltersButton.style.color = '';
    }
}
