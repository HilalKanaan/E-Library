const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function headers(json = true){
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  const t = localStorage.getItem('token');
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

/* ========== Auth ========== */
export async function login(username, password){
  const r = await fetch(`${API}/api/auth/login`, {
    method:'POST', headers: headers(), body: JSON.stringify({ username, password })
  });
  if(!r.ok) throw new Error('login failed'); return r.json();
}

export async function register(data){
  const r = await fetch(`${API}/api/auth/register`, {
    method:'POST', headers: headers(), body: JSON.stringify(data)
  });
  if(!r.ok) throw new Error('register failed'); return r.json();
}

export async function me(){
  const r = await fetch(`${API}/api/me`, { headers: headers(false) });
  if(!r.ok) throw new Error('me failed'); return r.json();
}

/* ========== Books ========== */
export async function listBooks(params = {}){
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${API}/api/books?${qs}`, { headers: headers(false) });
  if(!r.ok) throw new Error('list books failed'); return r.json();
}

export async function getBook(id){
  const r = await fetch(`${API}/api/books/${id}`, { headers: headers(false) });
  if(!r.ok) throw new Error('get book failed'); return r.json();
}

export async function getBookDetails(id){
  const r = await fetch(`${API}/api/books/${id}/details`, { headers: headers(false) });
  if(!r.ok) throw new Error('get book details failed'); return r.json();
}

export async function createBook(book){
  const r = await fetch(`${API}/api/books`, {
    method:'POST', headers: headers(), body: JSON.stringify(book)
  });
  if(!r.ok) throw new Error('create book failed'); return r.json();
}

export async function updateBook(id, book){
  const r = await fetch(`${API}/api/books/${id}`, {
    method:'PUT', headers: headers(), body: JSON.stringify(book)
  });
  if(!r.ok) throw new Error('update book failed'); return true;
}

export async function deleteBook(id){
  const r = await fetch(`${API}/api/books/${id}`, {
    method:'DELETE', headers: headers(false)
  });
  if(!r.ok) throw new Error('delete book failed'); return true;
}

/* ========== Borrows ========== */
export async function borrow(bookId){
  const r = await fetch(`${API}/api/borrows`, {
    method:'POST', headers: headers(), body: JSON.stringify({ bookId })
  });
  if(!r.ok) throw new Error('borrow failed'); return r.json();
}

export async function myBorrows(){
  const r = await fetch(`${API}/api/borrows/me`, { headers: headers(false) });
  if(!r.ok) throw new Error('my borrows failed'); return r.json();
}

export async function returnBorrow(id){
  const r = await fetch(`${API}/api/borrows/${id}/return`, {
    method:'POST', headers: headers(false)
  });
  if(!r.ok) throw new Error('return failed'); return r.json();
}

export async function renewBorrow(id){
  const r = await fetch(`${API}/api/borrows/${id}/renew`, {
    method:'POST', headers: headers(false)
  });
  if(!r.ok) throw new Error('renew failed'); return r.json();
}

/* ========== Reviews ========== */
export async function listReviews(bookId){
  const r = await fetch(`${API}/api/reviews/book/${bookId}`, { headers: headers(false) });
  if(!r.ok) throw new Error('list reviews failed'); return r.json();
}

export async function upsertReview(bookId, rating, comment){
  const r = await fetch(`${API}/api/reviews`, {
    method:'POST', headers: headers(), body: JSON.stringify({ bookId, rating, comment })
  });
  if(!r.ok) throw new Error('review failed'); return r.json();
}

/* ========== Follows ========== */
export async function listFollows(){
  const r = await fetch(`${API}/api/follows`, { headers: headers(false) });
  if(!r.ok) throw new Error('follows failed'); return r.json();
}

// GUID detector
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function followAuthor(input){
  // Accepts string (id or name) OR object {authorId?, id?, authorName?, name?}
  let body = null;

  if (typeof input === 'string') {
    const s = input.trim();
    body = GUID_RE.test(s) ? { authorId: s } : { authorName: s };
  } else if (input && typeof input === 'object') {
    if (input.authorId || input.id) body = { authorId: input.authorId || input.id };
    else if (input.authorName || input.name) body = { authorName: input.authorName || input.name };
  }

  if (!body) throw new Error('followAuthor: missing authorId/authorName');

  const r = await fetch(`${API}/api/follows`, {
    method:'POST', headers: headers(), body: JSON.stringify(body)
  });
  if(!r.ok){ const t = await r.text(); throw new Error(t || 'follow failed'); }
  return r.json();
}

export async function unfollowAuthor(input){
  // Prefer DELETE /api/follows/{key}. Fallback to JSON body if server expects it.
  const key = typeof input === 'string'
    ? input
    : (input.id || input.authorId || input.name || input.authorName);

  let r = await fetch(`${API}/api/follows/${encodeURIComponent(key)}`, {
    method:'DELETE', headers: headers(false)
  });

  if (r.status === 405 || r.status === 404) {
    const body = GUID_RE.test(key) ? { authorId: key } : { authorName: key };
    r = await fetch(`${API}/api/follows`, {
      method:'DELETE', headers: headers(), body: JSON.stringify(body)
    });
  }

  if(!r.ok){ const t = await r.text(); throw new Error(t || 'unfollow failed'); }
  return true;
}

/* ========== Notifications ========== */
export async function listNotifications(unreadOnly = true){
  const r = await fetch(`${API}/api/notifications?unreadOnly=${unreadOnly}`, {
    headers: headers(false)
  });
  if(!r.ok) throw new Error('notifications failed'); return r.json();
}

export async function markNotificationRead(id){
  const r = await fetch(`${API}/api/notifications/${id}/read`, {
    method:'POST', headers: headers(false)
  });
  if(!r.ok) throw new Error('mark read failed'); return true;
}

export async function markAllNotificationsRead(){
  const r = await fetch(`${API}/api/notifications/read-all`, {
    method:'POST', headers: headers(false)
  });
  if(!r.ok) throw new Error('mark all read failed'); return true;
}

/* ========== Authors ========== */
export async function listAuthors(q = ""){
  const r = await fetch(`${API}/api/authors${q ? `?q=${encodeURIComponent(q)}` : ""}`, {
    headers: headers(false)
  });
  if(!r.ok) throw new Error('list authors failed'); return r.json();
}

export async function getAuthor(id){
  const r = await fetch(`${API}/api/authors/${id}`, { headers: headers(false) });
  if(!r.ok) throw new Error('get author failed'); return r.json();
}

export async function createAuthor(nameOrData){
  const body = typeof nameOrData === 'string' ? { name: nameOrData } : nameOrData;
  const r = await fetch(`${API}/api/authors`, {
    method:'POST', headers: headers(), body: JSON.stringify(body)
  });
  if(!r.ok){ const t = await r.text(); throw new Error(t || 'create author failed'); }
  return r.json();
}

export async function updateAuthor(id, data){
  const r = await fetch(`${API}/api/authors/${id}`, {
    method:'PUT', headers: headers(), body: JSON.stringify(data)
  });
  if(!r.ok){ const t = await r.text(); throw new Error(t || 'update author failed'); }
  return true;
}

export async function deleteAuthor(id){
  const r = await fetch(`${API}/api/authors/${id}`, {
    method:'DELETE', headers: headers(false)
  });
  if(!r.ok){ const t = await r.text(); throw new Error(t || 'delete author failed'); }
  return true;
}

export async function getMyProfile(){
  const r = await fetch(`${API}/api/profile/me`, { headers: headers(false) });
  if(!r.ok) throw new Error('profile failed');
  return r.json();
}

