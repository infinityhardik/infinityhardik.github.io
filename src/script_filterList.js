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
        if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
            values.add(String(item[key]).trim()); // Ensure values are stored as strings and trimmed
        }
    });
    return Array.from(values).sort(); // Sort values alphabetically
}

/**
 * Opens the filter modal and ensures filter options are populated and checkbox states are updated.
 */
function openFilterModal() {
    // Always populate filter options and update checkbox states when modal opens
    // This ensures filters are always up-to-date with current product data.
    if (productsData && productsData.productDirectory && productsData.productDirectory.length > 0) {
        populateFilterOptions();
    }
    updateFilterCheckboxStates(); // Always update checkbox states when modal opens
    resetFocus(); // Reset focus when the filter modal opens
}

/**
 * Populates the checkboxes for a specific filter category within its tab pane.
 * This function is called when a filter tab is activated (clicked or initially shown).
 * @param {string} filterKey - The key of the filter category (e.g., 'Product Type').
 * @param {HTMLElement} tabPaneElement - The HTML element of the tab pane content.
 */
function populateTabContentForCategory(filterKey, tabPaneElement) {
    // Check if content is already populated to avoid duplication
    if (tabPaneElement.children.length > 0) {
        updateFilterCheckboxStates(); // Just update states if already populated
        return;
    }

    const uniqueValues = getUniqueValues(productsData.productDirectory, filterKey);

    if (uniqueValues.length === 0) {
        tabPaneElement.innerHTML = '<p class="text-muted">No options available</p>';
        return;
    }

    uniqueValues.forEach(value => {
        const formCheck = document.createElement('div');
        formCheck.classList.add('form-check', 'mb-2');

        const input = document.createElement('input');
        input.classList.add('form-check-input', 'filter-checkbox');
        input.type = 'checkbox';
        input.value = value;
        input.id = `filter-${filterKey.replace(/[\s\.]/g, '-')}-${value.replace(/[\s\.]/g, '-')}`;
        input.dataset.filterKey = filterKey; // Store the original key name

        const label = document.createElement('label');
        label.classList.add('form-check-label');
        label.htmlFor = input.id;
        label.textContent = value;

        formCheck.appendChild(input);
        formCheck.appendChild(label);
        tabPaneElement.appendChild(formCheck);

        // Add event listener to update selectedFilters on change
        input.addEventListener('change', (event) => {
            const currentFilterKey = event.target.dataset.filterKey;
            const currentFilterValue = event.target.value;

            if (event.target.checked) {
                if (!selectedFilters[currentFilterKey]) {
                    selectedFilters[currentFilterKey] = [];
                }
                if (!selectedFilters[currentFilterKey].includes(currentFilterValue)) {
                    selectedFilters[currentFilterKey].push(currentFilterValue);
                }
            } else {
                if (selectedFilters[currentFilterKey]) {
                    selectedFilters[currentFilterKey] = selectedFilters[currentFilterKey].filter(val => val !== currentFilterValue);
                    if (selectedFilters[currentFilterKey].length === 0) {
                        delete selectedFilters[currentFilterKey]; // Remove key if no values selected
                    }
                }
            }
            updateClearFiltersButtonStyle(); // Update button style immediately
        });
    });

    // After populating, update the checkbox states for this specific pane
    updateFilterCheckboxStates();
}

/**
 * Populates the filter options (tabs and their panes) in the modal based on product data.
 */
function populateFilterOptions() {
    const listTab = document.getElementById('list-tab');
    const navTabContent = document.getElementById('nav-tabContent');

    if (!listTab || !navTabContent) {
        console.error('Filter modal elements not found');
        return;
    }

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

    let isFirstTab = true;

    for (const key in filterKeys) {
        const displayName = filterKeys[key];
        const uniqueValues = getUniqueValues(productsData.productDirectory, key);

        if (uniqueValues.length > 0) {
            // Create tab button
            const buttonId = `list-${key.replace(/[\s\.]/g, '-')}-list`;
            const tabPaneId = `${key.replace(/[\s\.]/g, '-')}-tab-pane`;

            const button = document.createElement('button');
            button.classList.add('list-group-item', 'list-group-item-action');
            if (isFirstTab) {
                button.classList.add('active');
                button.setAttribute('aria-current', 'true');
            }
            button.id = buttonId;
            button.dataset.bsToggle = 'list';
            button.dataset.bsTarget = `#${tabPaneId}`;
            button.type = 'button';
            button.role = 'tab';
            button.setAttribute('aria-controls', tabPaneId);
            button.textContent = displayName;

            // Store the filter key in dataset for easy access
            button.dataset.filterKey = key;

            listTab.appendChild(button);

            // Create tab pane content
            const tabPane = document.createElement('div');
            tabPane.classList.add('tab-pane', 'fade');
            if (isFirstTab) {
                tabPane.classList.add('show', 'active');
            }
            tabPane.id = tabPaneId;
            tabPane.role = 'tabpanel';
            tabPane.setAttribute('aria-labelledby', buttonId);
            navTabContent.appendChild(tabPane);

            // Add click event listener to populate content when tab is clicked
            button.addEventListener('click', (event) => {
                event.preventDefault();

                // Remove active class from all tabs
                listTab.querySelectorAll('.list-group-item').forEach(tab => {
                    tab.classList.remove('active');
                    tab.removeAttribute('aria-current');
                });

                // Remove active class from all tab panes
                navTabContent.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });

                // Set clicked tab as active
                button.classList.add('active');
                button.setAttribute('aria-current', 'true');

                // Set corresponding tab pane as active
                const targetTabPane = document.getElementById(tabPaneId);
                if (targetTabPane) {
                    targetTabPane.classList.add('show', 'active');

                    // Populate the content for this category
                    const filterKey = button.dataset.filterKey;
                    if (filterKey) {
                        populateTabContentForCategory(filterKey, targetTabPane);
                    }
                }
            });

            // If this is the first tab, populate it immediately
            if (isFirstTab) {
                populateTabContentForCategory(key, tabPane);
                isFirstTab = false;
            }
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
        const isSelected = selectedFilters[filterKey] && selectedFilters[filterKey].includes(filterValue);

        checkbox.checked = isSelected;

        // Update label style based on checked state for visual feedback
        const label = checkbox.nextElementSibling;
        if (label) {
            if (isSelected) {
                label.style.fontWeight = 'bold';
                label.style.color = '#0d6efd';
            } else {
                label.style.fontWeight = 'normal';
                label.style.color = '';
            }
        }
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
            filteredProducts = filteredProducts.filter(product => {
                const productValue = product[key];
                return productValue !== undefined &&
                    productValue !== null &&
                    filterValues.includes(String(productValue).trim());
            });
        }
    }

    displayProducts(filteredProducts); // Display the filtered results
    resetFocus(); // Reset focus after filtering

    // Show feedback message
    const filterCount = Object.keys(selectedFilters).length;
    const productCount = filteredProducts.length;
    if (filterCount > 0) {
        displayFeedbackMessage(`Applied ${filterCount} filter(s). Showing ${productCount} product(s).`, 'info');
    }
}

/**
 * Clears all active filters, displays all products, and updates button styles.
 */
function clearFilters() {
    selectedFilters = {}; // Reset global selected filters object

    // Uncheck all filter checkboxes in the modal
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.checked = false;
        // Reset label style
        const label = checkbox.nextElementSibling;
        if (label) {
            label.style.fontWeight = 'normal';
            label.style.color = '';
        }
    });

    displayProducts(productsData.productDirectory); // Display all original products
    updateClearFiltersButtonStyle(); // Reset button style
    resetFocus(); // Reset focus after clearing filters

    if (typeof displayFeedbackMessage === 'function') {
        displayFeedbackMessage('Filters cleared. Showing all products.', 'success');
    }
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
            if (filters.hasOwnProperty(key) && filters[key].length > 0) {
                const productValue = product[key];
                if (productValue === undefined ||
                    productValue === null ||
                    !filters[key].includes(String(productValue).trim())) {
                    return false; // If any filter doesn't match, exclude the product
                }
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
    const activeFilterCount = Object.keys(selectedFilters).reduce((count, key) => {
        return count + (selectedFilters[key] ? selectedFilters[key].length : 0);
    }, 0);

    if (filterButton) {
        if (filtersActive) {
            filterButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                Filter (${activeFilterCount})
            `;
        } else {
            filterButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                Filters
            `;
        }
    }

    if (clearFiltersButton) {
        if (filtersActive) {
            clearFiltersButton.classList.remove('d-none');
            clearFiltersButton.classList.add('d-flex');
        } else {
            clearFiltersButton.classList.add('d-none');
            clearFiltersButton.classList.remove('d-flex');
        }
    }
}

// Initialize filters when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Ensure the filter modal is properly initialized
    const filterModal = document.getElementById('filterModal');
    if (filterModal) {
        filterModal.addEventListener('shown.bs.modal', openFilterModal);
    }

    // Initialize button styles
    updateClearFiltersButtonStyle();
});