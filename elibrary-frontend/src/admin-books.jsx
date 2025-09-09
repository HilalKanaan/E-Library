import React, { useEffect, useState } from 'react'
import { listBooks, createBook, updateBook, deleteBook } from './api.js'

const empty = { isbn:'', title:'', author:'', genre:'', publishedYear:2020, description:'', coverUrl:'', totalCopies:1, availableCopies:1 }

export default function AdminBooks(){
  const [data,setData] = useState({ total:0, items:[] })
  const [form,setForm] = useState(empty)
  const [editingId,setEditingId] = useState(null)

  const load = async () => {
    const res = await listBooks({ page:1, pageSize:100 })
    setData(res)
  }

  useEffect(()=>{ load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if(editingId){
      await updateBook(editingId, form)
    }else{
      await createBook(form)
    }
    setForm(empty); setEditingId(null); await load()
  }

  const edit = (b) => {
    setEditingId(b.id)
    setForm({
      isbn:b.isbn, title:b.title, author:b.author, genre:b.genre||'',
      publishedYear:b.publishedYear||2020, description:b.description||'',
      coverUrl:b.coverUrl||'', totalCopies:b.totalCopies, availableCopies:b.availableCopies
    })
  }

  const remove = async (id) => {
    if(confirm('Delete this book?')){ await deleteBook(id); await load() }
  }

  const set = (k,v)=>setForm(f=>({...f,[k]:v}))

  return (
    <div className="card">
      <h2>Admin • Books</h2>
      <form className="row" onSubmit={submit}>
        <input placeholder="ISBN" value={form.isbn} onChange={e=>set('isbn', e.target.value)} />
        <input placeholder="Title" value={form.title} onChange={e=>set('title', e.target.value)} />
        <input placeholder="Author" value={form.author} onChange={e=>set('author', e.target.value)} />
        <input placeholder="Genre" value={form.genre} onChange={e=>set('genre', e.target.value)} />
        <input placeholder="Year" type="number" value={form.publishedYear} onChange={e=>set('publishedYear', Number(e.target.value))} />
        <input placeholder="Total" type="number" value={form.totalCopies} onChange={e=>set('totalCopies', Number(e.target.value))} />
        <input placeholder="Available" type="number" value={form.availableCopies} onChange={e=>set('availableCopies', Number(e.target.value))} />
        <button className="button">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" className="button secondary" onClick={()=>{setEditingId(null); setForm(empty)}}>Cancel</button>}
      </form>

      <table className="table">
        <thead><tr><th>Title</th><th>Author</th><th>Available/Total</th><th></th></tr></thead>
        <tbody>
          {data.items.map(b => (
            <tr key={b.id}>
              <td>{b.title}</td>
              <td>{b.author}</td>
              <td>{b.availableCopies}/{b.totalCopies}</td>
              <td>
                <button className="button secondary" onClick={()=>edit(b)}>Edit</button>
                <button className="button" onClick={()=>remove(b.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}