const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function headers(json=true){
  const h = {}
  if(json) h['Content-Type']='application/json'
  const t = localStorage.getItem('token')
  if(t) h['Authorization'] = `Bearer ${t}`
  return h
}

export async function login(username, password){
  const r = await fetch(`${API}/api/auth/login`, {
    method:'POST', headers: headers(), body: JSON.stringify({ username, password })
  })
  if(!r.ok) throw new Error('login failed')
  return r.json()
}

export async function register(data){
  const r = await fetch(`${API}/api/auth/register`, {
    method:'POST', headers: headers(), body: JSON.stringify(data)
  })
  if(!r.ok) throw new Error('register failed')
  return r.json()
}

export async function me(){
  const r = await fetch(`${API}/api/me`, { headers: headers(false) })
  if(!r.ok) throw new Error('me failed')
  return r.json()
}

export async function listBooks(params={}){
  const qs = new URLSearchParams(params).toString()
  const r = await fetch(`${API}/api/books?${qs}`, { headers: headers(false) })
  if(!r.ok) throw new Error('list books failed')
  return r.json()
}

export async function createBook(book){
  const r = await fetch(`${API}/api/books`, { method:'POST', headers: headers(), body: JSON.stringify(book) })
  if(!r.ok) throw new Error('create book failed')
  return r.json()
}

export async function updateBook(id, book){
  const r = await fetch(`${API}/api/books/${id}`, { method:'PUT', headers: headers(), body: JSON.stringify(book) })
  if(!r.ok) throw new Error('update book failed')
  return true
}

export async function deleteBook(id){
  const r = await fetch(`${API}/api/books/${id}`, { method:'DELETE', headers: headers(false) })
  if(!r.ok) throw new Error('delete book failed')
  return true
}

export async function borrow(bookId){
  const r = await fetch(`${API}/api/borrows`, { method:'POST', headers: headers(), body: JSON.stringify({ bookId }) })
  if(!r.ok) throw new Error('borrow failed')
  return r.json()
}

export async function myBorrows(){
  const r = await fetch(`${API}/api/borrows/me`, { headers: headers(false) })
  if(!r.ok) throw new Error('my borrows failed')
  return r.json()
}

export async function returnBorrow(id){
  const r = await fetch(`${API}/api/borrows/${id}/return`, { method:'POST', headers: headers(false) })
  if(!r.ok) throw new Error('return failed')
  return r.json()
}

export async function getBookDetails(id){
  const r = await fetch(`${API}/api/books/${id}/details`, { headers: headers(false) })
  if(!r.ok) throw new Error('get book failed')
  return r.json()
}

export async function listReviews(bookId){
  const r = await fetch(`${API}/api/reviews/book/${bookId}`, { headers: headers(false) })
  if(!r.ok) throw new Error('list reviews failed')
  return r.json()
}

export async function upsertReview(bookId, rating, comment){
  const r = await fetch(`${API}/api/reviews`, {
    method:'POST', headers: headers(), body: JSON.stringify({ bookId, rating, comment })
  })
  if(!r.ok) throw new Error('review failed')
  return r.json()
}
