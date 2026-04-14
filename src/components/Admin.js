import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Admin.css'

const API = 'https://backend-19yj.onrender.com'

export default function Admin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('products')

  // ── shared ──
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState(null)

  // ── products ──
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState(emptyProductForm())
  const [mainImageFile, setMainImageFile] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [removeGalleryIds, setRemoveGalleryIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // ── categories ──
  const [categories, setCategories] = useState([])
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ ka: '', en: '', ru: '' })

  // ── social ──
  const [social, setSocial] = useState({ whatsapp: '', facebook: '' })
  const [savingSocial, setSavingSocial] = useState(false)

  function emptyProductForm() {
    return { name_ka: '', name_en: '', name_ru: '', desc_ka: '', desc_en: '', desc_ru: '', price: '', category: '' }
  }

  const flash = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: '' }), 4000)
  }

  // ── init ──
  useEffect(() => {
    checkDb()
    fetchProducts()
    fetchCategories()
    fetchSocial()
  }, [])

  const checkDb = async () => {
    try {
      const r = await fetch(`${API}/`)
      const d = await r.json()
      setDbStatus(d.database)
    } catch { setDbStatus('error') }
  }

  // ── Products ──
  const fetchProducts = useCallback(async (search = '') => {
    setLoadingProducts(true)
    try {
      const url = search ? `${API}/products?search=${encodeURIComponent(search)}` : `${API}/products`
      const r = await fetch(url)
      const d = await r.json()
      setProducts(d.products || [])
    } catch { flash('პროდუქტების ჩატვირთვა ვერ მოხერხდა', 'error') }
    finally { setLoadingProducts(false) }
  }, [])

  const handleProductSubmit = async () => {
    const { name_ka, name_en, name_ru, desc_ka, desc_en, desc_ru, price } = productForm
    if (!name_ka || !name_en || !name_ru) return flash('სახელი ყველა ენაზე სავალდებულოა', 'error')
    if (!desc_ka || !desc_en || !desc_ru) return flash('აღწერა ყველა ენაზე სავალდებულოა', 'error')
    if (!price) return flash('ფასი სავალდებულოა', 'error')
    if (!editingProduct && !mainImageFile) return flash('მთავარი სურათი სავალდებულოა', 'error')

    setLoading(true)
    const fd = new FormData()
    Object.entries(productForm).forEach(([k, v]) => { if (v) fd.append(k, v) })
    if (mainImageFile) fd.append('mainImage', mainImageFile)
    galleryFiles.forEach(f => fd.append('gallery', f))
    if (removeGalleryIds.length) fd.append('removeGalleryIds', JSON.stringify(removeGalleryIds))

    try {
      const url = editingProduct ? `${API}/products/${editingProduct._id}` : `${API}/products`
      const method = editingProduct ? 'PUT' : 'POST'
      const r = await fetch(url, { method, body: fd })
      const d = await r.json()
      if (r.ok) {
        flash(editingProduct ? 'პროდუქტი განახლდა ✓' : 'პროდუქტი დაემატა ✓')
        resetProductForm()
        fetchProducts(searchQuery)
      } else {
        flash(d.error || 'შეცდომა', 'error')
      }
    } catch { flash('შეცდომა', 'error') }
    finally { setLoading(false) }
  }

  const resetProductForm = () => {
    setProductForm(emptyProductForm())
    setMainImageFile(null)
    setGalleryFiles([])
    setRemoveGalleryIds([])
    setEditingProduct(null)
  }

  const startEditProduct = (p) => {
    setEditingProduct(p)
    setProductForm({
      name_ka: p.name?.ka || '', name_en: p.name?.en || '', name_ru: p.name?.ru || '',
      desc_ka: p.description?.ka || '', desc_en: p.description?.en || '', desc_ru: p.description?.ru || '',
      price: p.price?.toString() || '',
      category: p.category?._id || ''
    })
    setRemoveGalleryIds([])
    setActiveTab('products')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteProduct = async (p) => {
    if (!window.confirm(`"${p.name?.ka}" წაიშალოს?`)) return
    try {
      const r = await fetch(`${API}/products/${p._id}`, { method: 'DELETE' })
      if (r.ok) { flash('წაიშალა ✓'); fetchProducts(searchQuery) }
      else flash('წაშლა ვერ მოხერხდა', 'error')
    } catch { flash('წაშლა ვერ მოხერხდა', 'error') }
  }

  const toggleRemoveGallery = (publicId) => {
    setRemoveGalleryIds(prev =>
      prev.includes(publicId) ? prev.filter(id => id !== publicId) : [...prev, publicId]
    )
  }

  // ── Categories ──
  const fetchCategories = async () => {
    try {
      const r = await fetch(`${API}/categories`)
      const d = await r.json()
      setCategories(d.categories || [])
    } catch {}
  }

  const handleCategorySubmit = async () => {
    const { ka, en, ru } = categoryForm
    if (!ka || !en || !ru) return flash('სახელი ყველა ენაზე სავალდებულოა', 'error')
    setLoading(true)
    try {
      const url = editingCategory ? `${API}/categories/${editingCategory._id}` : `${API}/categories`
      const method = editingCategory ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })
      const d = await r.json()
      if (r.ok) {
        flash(editingCategory ? 'კატეგორია განახლდა ✓' : 'კატეგორია დაემატა ✓')
        setCategoryForm({ ka: '', en: '', ru: '' })
        setEditingCategory(null)
        fetchCategories()
      } else flash(d.error || 'შეცდომა', 'error')
    } catch { flash('შეცდომა', 'error') }
    finally { setLoading(false) }
  }

  const deleteCategory = async (c) => {
    if (!window.confirm(`"${c.name?.ka}" წაიშალოს?`)) return
    try {
      const r = await fetch(`${API}/categories/${c._id}`, { method: 'DELETE' })
      if (r.ok) { flash('წაიშალა ✓'); fetchCategories() }
      else flash('წაშლა ვერ მოხერხდა', 'error')
    } catch { flash('წაშლა ვერ მოხერხდა', 'error') }
  }

  // ── Social ──
  const fetchSocial = async () => {
    try {
      const r = await fetch(`${API}/social`)
      const d = await r.json()
      setSocial({ whatsapp: d.social?.whatsapp || '', facebook: d.social?.facebook || '' })
    } catch {}
  }

  const saveSocial = async () => {
    setSavingSocial(true)
    try {
      const r = await fetch(`${API}/social`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(social)
      })
      if (r.ok) flash('სოციალური ბმულები შენახულია ✓')
      else flash('შეცდომა', 'error')
    } catch { flash('შეცდომა', 'error') }
    finally { setSavingSocial(false) }
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    navigate('/')
  }

  const tabs = [
    { id: 'products', label: 'პროდუქტები', count: products.length },
    { id: 'categories', label: 'კატეგორიები', count: categories.length },
    { id: 'social', label: 'სოციალური' },
  ]

  return (
    <div className="admin-root">

      {/* ── Header ── */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-logo">
            <span className="admin-logo-dot" />
            <span>Admin Panel</span>
          </div>
          <div className="admin-header-right">
            {dbStatus && (
              <span className={`db-badge ${dbStatus === 'connected' ? 'db-ok' : 'db-err'}`}>
                {dbStatus === 'connected' ? '● DB' : '○ DB'}
              </span>
            )}
            <button className="logout-btn" onClick={handleLogout}>გასვლა</button>
          </div>
        </div>

        <nav className="admin-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`admin-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              {t.count !== undefined && <span className="tab-count">{t.count}</span>}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Flash message ── */}
      {msg.text && (
        <div className={`flash-msg flash-${msg.type}`}>{msg.text}</div>
      )}

      <main className="admin-main">

        {/* ════════════ PRODUCTS ════════════ */}
        {activeTab === 'products' && (
          <div className="tab-content">

            {/* Form */}
            <section className="card">
              <h2 className="card-title">
                {editingProduct ? `✏️ რედაქტირება: ${editingProduct.name?.ka}` : '+ ახალი პროდუქტი'}
              </h2>

              <div className="lang-section">
                <p className="lang-label">🇬🇪 ქართული</p>
                <div className="form-row">
                  <div className="form-group">
                    <label>სახელი (KA)</label>
                    <input className="input" value={productForm.name_ka}
                      onChange={e => setProductForm(f => ({ ...f, name_ka: e.target.value }))}
                      placeholder="პროდუქტის სახელი" />
                  </div>
                  <div className="form-group form-group-full">
                    <label>აღწერა (KA)</label>
                    <textarea className="textarea" value={productForm.desc_ka}
                      onChange={e => setProductForm(f => ({ ...f, desc_ka: e.target.value }))}
                      placeholder="აღწერა ქართულად" rows={3} />
                  </div>
                </div>
              </div>

              <div className="lang-section">
                <p className="lang-label">🇬🇧 English</p>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name (EN)</label>
                    <input className="input" value={productForm.name_en}
                      onChange={e => setProductForm(f => ({ ...f, name_en: e.target.value }))}
                      placeholder="Product name" />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Description (EN)</label>
                    <textarea className="textarea" value={productForm.desc_en}
                      onChange={e => setProductForm(f => ({ ...f, desc_en: e.target.value }))}
                      placeholder="Description in English" rows={3} />
                  </div>
                </div>
              </div>

              <div className="lang-section">
                <p className="lang-label">🇷🇺 Русский</p>
                <div className="form-row">
                  <div className="form-group">
                    <label>Название (RU)</label>
                    <input className="input" value={productForm.name_ru}
                      onChange={e => setProductForm(f => ({ ...f, name_ru: e.target.value }))}
                      placeholder="Название товара" />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Описание (RU)</label>
                    <textarea className="textarea" value={productForm.desc_ru}
                      onChange={e => setProductForm(f => ({ ...f, desc_ru: e.target.value }))}
                      placeholder="Описание на русском" rows={3} />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ფასი (₾)</label>
                  <input className="input" type="number" min="0" step="0.01"
                    value={productForm.price}
                    onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>კატეგორია</label>
                  <select className="input" value={productForm.category}
                    onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">— კატეგორია —</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name?.ka}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>მთავარი სურათი {editingProduct && '(სურვილისამებრ)'}</label>
                  <label className="file-label">
                    <input type="file" accept="image/*" className="file-hidden"
                      onChange={e => setMainImageFile(e.target.files[0])} />
                    <span className="file-btn">📁 {mainImageFile ? mainImageFile.name : 'აირჩიეთ'}</span>
                  </label>
                  {mainImageFile && (
                    <img src={URL.createObjectURL(mainImageFile)} alt="preview" className="img-preview" />
                  )}
                  {editingProduct?.mainImageUrl && !mainImageFile && (
                    <img src={editingProduct.mainImageUrl} alt="current" className="img-preview" />
                  )}
                </div>
                <div className="form-group">
                  <label>გალერეა (მაქს. 10)</label>
                  <label className="file-label">
                    <input type="file" accept="image/*" multiple className="file-hidden"
                      onChange={e => setGalleryFiles(Array.from(e.target.files))} />
                    <span className="file-btn">📁 {galleryFiles.length > 0 ? `${galleryFiles.length} ფაილი` : 'აირჩიეთ'}</span>
                  </label>
                </div>
              </div>

              {/* Existing gallery when editing */}
              {editingProduct?.galleryImages?.length > 0 && (
                <div className="gallery-grid">
                  <p className="gallery-hint">გალერეა — მოსაშლელი სურათები მონიშნეთ:</p>
                  {editingProduct.galleryImages.map(img => (
                    <div key={img.publicId}
                      className={`gallery-thumb ${removeGalleryIds.includes(img.publicId) ? 'gallery-thumb-remove' : ''}`}
                      onClick={() => toggleRemoveGallery(img.publicId)}>
                      <img src={img.url} alt="" />
                      {removeGalleryIds.includes(img.publicId) && <span className="gallery-x">✕</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions">
                {editingProduct && (
                  <button className="btn-ghost" onClick={resetProductForm}>გაუქმება</button>
                )}
                <button className="btn-primary" onClick={handleProductSubmit} disabled={loading}>
                  {loading ? 'მუშავდება...' : editingProduct ? 'განახლება' : 'დამატება'}
                </button>
              </div>
            </section>

            {/* Search + list */}
            <section className="card">
              <div className="list-header">
                <h2 className="card-title">ყველა პროდუქტი ({products.length})</h2>
                <div className="search-row">
                  <input className="input search-input" placeholder="ძებნა..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); fetchProducts(e.target.value) }} />
                </div>
              </div>

              {loadingProducts ? (
                <div className="empty-state">იტვირთება...</div>
              ) : products.length === 0 ? (
                <div className="empty-state">პროდუქტი არ მოიძებნა</div>
              ) : (
                <div className="product-list">
                  {products.map(p => (
                    <div key={p._id} className={`product-row ${editingProduct?._id === p._id ? 'product-row-editing' : ''}`}>
                      {p.mainImageUrl && (
                        <img src={p.mainImageUrl} alt={p.name?.ka} className="product-thumb" />
                      )}
                      <div className="product-info">
                        <p className="product-name">{p.name?.ka}</p>
                        <p className="product-sub">{p.name?.en} · {p.name?.ru}</p>
                        {p.category && <span className="cat-tag">{p.category.name?.ka}</span>}
                      </div>
                      <div className="product-price-col">₾{p.price?.toFixed(2)}</div>
                      <div className="product-actions">
                        <button className="btn-sm btn-edit" onClick={() => startEditProduct(p)}>✏️</button>
                        <button className="btn-sm btn-del" onClick={() => deleteProduct(p)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ════════════ CATEGORIES ════════════ */}
        {activeTab === 'categories' && (
          <div className="tab-content">
            <section className="card">
              <h2 className="card-title">
                {editingCategory ? `✏️ რედაქტირება: ${editingCategory.name?.ka}` : '+ ახალი კატეგორია'}
              </h2>
              <div className="form-row three-col">
                <div className="form-group">
                  <label>სახელი (KA) 🇬🇪</label>
                  <input className="input" value={categoryForm.ka}
                    onChange={e => setCategoryForm(f => ({ ...f, ka: e.target.value }))}
                    placeholder="ქართული" />
                </div>
                <div className="form-group">
                  <label>Name (EN) 🇬🇧</label>
                  <input className="input" value={categoryForm.en}
                    onChange={e => setCategoryForm(f => ({ ...f, en: e.target.value }))}
                    placeholder="English" />
                </div>
                <div className="form-group">
                  <label>Название (RU) 🇷🇺</label>
                  <input className="input" value={categoryForm.ru}
                    onChange={e => setCategoryForm(f => ({ ...f, ru: e.target.value }))}
                    placeholder="Русский" />
                </div>
              </div>
              <div className="form-actions">
                {editingCategory && (
                  <button className="btn-ghost" onClick={() => { setEditingCategory(null); setCategoryForm({ ka: '', en: '', ru: '' }) }}>
                    გაუქმება
                  </button>
                )}
                <button className="btn-primary" onClick={handleCategorySubmit} disabled={loading}>
                  {loading ? 'მუშავდება...' : editingCategory ? 'განახლება' : 'დამატება'}
                </button>
              </div>
            </section>

            <section className="card">
              <h2 className="card-title">კატეგორიები ({categories.length})</h2>
              {categories.length === 0 ? (
                <div className="empty-state">კატეგორია არ არის</div>
              ) : (
                <div className="category-list">
                  {categories.map(c => (
                    <div key={c._id} className="category-row">
                      <div className="category-langs">
                        <span className="cat-ka">{c.name?.ka}</span>
                        <span className="cat-other">{c.name?.en}</span>
                        <span className="cat-other">{c.name?.ru}</span>
                      </div>
                      <div className="product-actions">
                        <button className="btn-sm btn-edit" onClick={() => {
                          setEditingCategory(c)
                          setCategoryForm({ ka: c.name?.ka || '', en: c.name?.en || '', ru: c.name?.ru || '' })
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}>✏️</button>
                        <button className="btn-sm btn-del" onClick={() => deleteCategory(c)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ════════════ SOCIAL ════════════ */}
        {activeTab === 'social' && (
          <div className="tab-content">
            <section className="card">
              <h2 className="card-title">სოციალური ბმულები</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input className="input" value={social.whatsapp}
                    onChange={e => setSocial(s => ({ ...s, whatsapp: e.target.value }))}
                    placeholder="https://wa.me/..." />
                </div>
                <div className="form-group">
                  <label>Facebook</label>
                  <input className="input" value={social.facebook}
                    onChange={e => setSocial(s => ({ ...s, facebook: e.target.value }))}
                    placeholder="https://facebook.com/..." />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={saveSocial} disabled={savingSocial}>
                  {savingSocial ? 'ინახება...' : 'შენახვა'}
                </button>
              </div>
            </section>
          </div>
        )}

      </main>
    </div>
  )
}