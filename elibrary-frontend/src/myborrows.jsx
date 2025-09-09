import React, { useEffect, useState } from 'react'
import { myBorrows, returnBorrow } from './api.js'

export default function MyBorrows(){
  const [items,setItems] = useState([])
  const [msg,setMsg] = useState('')

  const load = async () => {
    const res = await myBorrows(); setItems(res)
  }

  useEffect(()=>{ load() }, [])

  const doReturn = async (id) => {
    await returnBorrow(id); setMsg('Returned'); await load()
  }

  return (
    <div className="card">
      <h2>My Borrows</h2>
      {msg && <small>{msg}</small>}
      <table className="table">
        <thead><tr><th>Title</th><th>Borrowed At</th><th>Due</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {items.map(b => (
            <tr key={b.id}>
              <td>{b.book?.title}</td>
              <td>{new Date(b.borrowedAt).toLocaleString()}</td>
              <td>{new Date(b.dueAt).toLocaleString()}</td>
              <td><span className="badge">{b.status}</span></td>
              <td>
                {!b.returnedAt && <button className="button" onClick={()=>doReturn(b.id)}>Return</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}