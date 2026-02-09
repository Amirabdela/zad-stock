import React, { useState, useEffect } from 'react';
import { db, queueSyncAction } from '../db';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

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
      console.error('Failed to load products for POS:', err);
    }
  };

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      alert('This product is out of stock.');
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert(`Cannot add more. Only ${product.quantity} items available in stock.`);
          return prevCart;
        }
        return prevCart.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          product_id: product.id,
          product_name: product.name,
          cost_price: product.cost_price,
          selling_price: product.selling_price,
          quantity: 1,
          max_stock: product.quantity
        }];
      }
    });
  };

  const updateQuantity = (productId, amount) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product_id === productId) {
          const newQty = item.quantity + amount;
          if (newQty <= 0) return null;
          if (newQty > item.max_stock) {
            alert(`Only ${item.max_stock} items available in stock.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const totalAmount = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const totalCost = cart.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);
  const totalProfit = totalAmount - totalCost;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Double check stock levels in db before checkout
    try {
      const saleId = 'sale_' + Math.random().toString(36).substr(2, 9);
      const timestamp = Date.now();

      // Start transaction or run operations
      // 1. Verify stock and update product quantities
      for (const item of cart) {
        const dbProduct = await db.products.get(item.product_id);
        if (!dbProduct || dbProduct.quantity < item.quantity) {
          alert(`Insufficient stock for ${item.product_name}. Available: ${dbProduct ? dbProduct.quantity : 0}`);
          return;
        }
      }

      // We will perform the stock decrease on Feb 10, but let's write it down now to have a fully functional checkout!
      // Decrease stock
      for (const item of cart) {
        await db.products.where('id').equals(item.product_id).modify(p => {
          p.quantity -= item.quantity;
          p.updated_at = timestamp;
        });
      }

      // 2. Write sale entry
      const saleData = {
        id: saleId,
        total_amount: totalAmount,
        total_cost: totalCost,
        total_profit: totalProfit,
        timestamp,
        updated_at: timestamp
      };
      await db.sales.add(saleData);

      // 3. Write sale items
      for (const item of cart) {
        const saleItemData = {
          id: 'sitem_' + Math.random().toString(36).substr(2, 9),
          sale_id: saleId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          cost_price: item.cost_price,
          selling_price: item.selling_price
        };
        await db.sale_items.add(saleItemData);
      }

      // 4. Queue Sync
      const fullSalePayload = {
        ...saleData,
        items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          cost_price: item.cost_price,
          selling_price: item.selling_price
        }))
      };
      await queueSyncAction('CREATE_SALE', fullSalePayload);

      // Reset cart and reload products
      setCart([]);
      setCheckoutSuccess(true);
      setTimeout(() => setCheckoutSuccess(false), 3000);
      loadProducts();
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Checkout failed: ' + err.message);
    }
  };

  // Filters
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pos-container" style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '2rem', height: 'calc(100vh - 120px)' }}>
      {/* Product Catalog */}
      <div className="pos-catalog" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="module-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h2>Point of Sale (POS)</h2>
            <p className="subtitle">Select items to create a sales transaction</p>
          </div>
        </div>

        <div className="filter-bar" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="search-input"
              style={{ height: '36px' }}
            />
          </div>
          <div className="filter-select-wrapper">
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
              style={{ height: '36px', minWidth: '150px' }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {checkoutSuccess && (
          <div className="badge badge-success" style={{ padding: '1rem', marginBottom: '1rem', width: '100%', display: 'flex', justifyContent: 'center', fontSize: '0.9rem', gap: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <CheckCircle size={18} /> Sale recorded successfully!
          </div>
        )}

        <div className="catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', overflowY: 'auto', flexGrow: 1, paddingRight: '0.5rem' }}>
          {filteredProducts.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0' }}>
              No products available.
            </div>
          ) : (
            filteredProducts.map(product => {
              const isOutOfStock = product.quantity === 0;
              const isLowStock = product.quantity > 0 && product.quantity < 10;
              
              return (
                <div 
                  key={product.id} 
                  className={`catalog-card ${isOutOfStock ? 'disabled' : ''}`}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'between',
                    opacity: isOutOfStock ? 0.6 : 1,
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ flexGrow: 1 }}>
                    <span className="badge badge-outline" style={{ fontSize: '0.65rem', marginBottom: '0.5rem' }}>{product.category}</span>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{product.name}</h4>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                      ${product.selling_price.toFixed(2)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: isOutOfStock ? 'var(--danger-color)' : isLowStock ? 'var(--warning-color)' : 'var(--text-muted)' }}>
                        Stock: {product.quantity}
                      </span>
                      {isOutOfStock && <span className="badge badge-danger" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>OUT</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Shopping Cart */}
      <div 
        className="pos-cart" 
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <ShoppingCart size={22} style={{ color: 'var(--primary-color)' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Current Transaction</h3>
          {cart.length > 0 && (
            <span style={{ marginLeft: 'auto', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyToContent: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '600' }}>
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </div>

        {/* Cart Items list */}
        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.25rem' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Your shopping cart is empty</p>
              <p style={{ fontSize: '0.75rem' }}>Select products from the left to start</p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.product_id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem 0', 
                  borderBottom: '1px solid #f1f5f9' 
                }}
              >
                <div style={{ flexGrow: 1, marginRight: '1rem' }}>
                  <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>{item.product_name}</h5>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ${item.selling_price.toFixed(2)} each
                  </span>
                </div>
                
                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                  <button 
                    className="btn-icon" 
                    onClick={() => updateQuantity(item.product_id, -1)}
                    style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', width: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button 
                    className="btn-icon" 
                    onClick={() => updateQuantity(item.product_id, 1)}
                    style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', minWidth: '50px', textAlign: 'right' }}>
                    ${(item.selling_price * item.quantity).toFixed(2)}
                  </span>
                  <button 
                    onClick={() => removeFromCart(item.product_id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout */}
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span>Items Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
              <span>Total Payable</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={clearCart}>
                Clear
              </button>
              <button className="btn btn-success" onClick={handleCheckout}>
                Complete Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
