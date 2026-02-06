import React, { useState, useEffect } from 'react';
import { db, queueSyncAction } from '../db';
import { Plus, Edit2, Trash2, Search, AlertCircle, X, ChevronRight } from 'lucide-react';

export default function Inventory({ isOnline }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  // Low stock threshold
  const LOW_STOCK_THRESHOLD = 10;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await db.products.toArray();
      // Sort alphabetically by name
      allProducts.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(allProducts);

      // Extract unique categories
      const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load products from IndexedDB:', err);
    }
  };

  const handleOpenAddForm = () => {
    setEditId(null);
    setName('');
    setCategory('');
    setCostPrice('');
    setSellingPrice('');
    setQuantity('');
    setShowForm(true);
  };

  const handleOpenEditForm = (product) => {
    setEditId(product.id);
    setName(product.name);
    setCategory(product.category || '');
    setCostPrice(product.cost_price.toString());
    setSellingPrice(product.selling_price.toString());
    setQuantity(product.quantity.toString());
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name || !costPrice || !sellingPrice || !quantity) {
      alert('Please fill out all required fields.');
      return;
    }

    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    const qty = parseInt(quantity, 10);

    if (isNaN(cost) || isNaN(selling) || isNaN(qty)) {
      alert('Prices and quantity must be valid numbers.');
      return;
    }

    const timestamp = Date.now();
    const productData = {
      name,
      category: category.trim() || 'Uncategorized',
      cost_price: cost,
      selling_price: selling,
      quantity: qty,
      updated_at: timestamp
    };

    try {
      if (editId) {
        // Edit Product
        const id = editId;
        const updatedProduct = { id, ...productData };
        await db.products.put(updatedProduct);
        await queueSyncAction('UPDATE_PRODUCT', updatedProduct);
      } else {
        // Add Product
        const id = 'prod_' + Math.random().toString(36).substr(2, 9);
        const newProduct = { id, ...productData };
        await db.products.add(newProduct);
        await queueSyncAction('CREATE_PRODUCT', newProduct);
      }

      setShowForm(false);
      loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product to database.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await db.products.delete(id);
      await queueSyncAction('DELETE_PRODUCT', { id });
      loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product.');
    }
  };

  // Filtered Products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="inventory-container">
      <div className="module-header">
        <div>
          <h2>Inventory Management</h2>
          <p className="subtitle">Manage shop products, stock levels, and pricing</p>
        </div>
        <button className="btn btn-primary btn-with-icon" onClick={handleOpenAddForm}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="search-input"
          />
        </div>
        <div className="filter-select-wrapper">
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th className="text-right">Cost Price</th>
              <th className="text-right">Selling Price</th>
              <th className="text-right">Stock Quantity</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center empty-state">
                  No products found. Add a product to get started.
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => {
                const isLowStock = product.quantity < LOW_STOCK_THRESHOLD;
                const isOutOfStock = product.quantity === 0;

                return (
                  <tr key={product.id} className={isOutOfStock ? 'out-of-stock-row' : ''}>
                    <td className="font-semibold">{product.name}</td>
                    <td><span className="badge badge-outline">{product.category}</span></td>
                    <td className="text-right">${product.cost_price.toFixed(2)}</td>
                    <td className="text-right">${product.selling_price.toFixed(2)}</td>
                    <td className="text-right font-semibold">{product.quantity}</td>
                    <td>
                      {isOutOfStock ? (
                        <span className="badge badge-danger badge-with-icon">
                          <AlertCircle size={12} /> Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="badge badge-warning badge-with-icon">
                          <AlertCircle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td className="text-center action-buttons">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => handleOpenEditForm(product)}
                        title="Edit Product"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => handleDelete(product.id)}
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editId ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label htmlFor="prodName">Product Name *</label>
                <input 
                  type="text" 
                  id="prodName" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Fresh Milk 1L"
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="prodCat">Category</label>
                <input 
                  type="text" 
                  id="prodCat" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  placeholder="e.g. Dairy"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="costPrice">Cost Price ($) *</label>
                  <input 
                    type="number" 
                    id="costPrice" 
                    step="0.01" 
                    min="0"
                    value={costPrice} 
                    onChange={(e) => setCostPrice(e.target.value)} 
                    placeholder="0.00"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sellingPrice">Selling Price ($) *</label>
                  <input 
                    type="number" 
                    id="sellingPrice" 
                    step="0.01" 
                    min="0"
                    value={sellingPrice} 
                    onChange={(e) => setSellingPrice(e.target.value)} 
                    placeholder="0.00"
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="quantity">Initial Stock Quantity *</label>
                <input 
                  type="number" 
                  id="quantity" 
                  min="0"
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  placeholder="0"
                  required 
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editId ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
