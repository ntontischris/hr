---
name: frontend-patterns
description: React and Next.js frontend patterns including forms, state management, data fetching, optimistic updates, modals, and toast notifications. Use when building UI components, forms, client-side state, or interactive features.
---

# Frontend Patterns (React + Next.js)

## Form with Server Action
```tsx
// components/create-project-form.tsx
'use client'
import { useActionState } from 'react'
import { createProject } from '@/app/actions/projects'

export function CreateProjectForm() {
  const [state, action, pending] = useActionState(createProject, null)

  return (
    <form action={action}>
      <input name="name" placeholder="Project name" required />
      {state?.error && <p className="text-red-500">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  )
}
```

## Optimistic Updates
```tsx
'use client'
import { useOptimistic } from 'react'

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  )

  async function handleAdd(formData: FormData) {
    const name = formData.get('name') as string
    addOptimistic({ id: 'temp', name, completed: false })
    await addTodo(formData) // server action
  }

  return (
    <form action={handleAdd}>
      {optimisticTodos.map(todo => (
        <div key={todo.id}>{todo.name}</div>
      ))}
      <input name="name" />
      <button type="submit">Add</button>
    </form>
  )
}
```

## Data Fetching Pattern (Server Component)
```tsx
// app/dashboard/page.tsx — Server Component
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsList />
      </Suspense>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel />
      </Suspense>
    </div>
  )
}

async function ProjectsList() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  
  return <div>{data?.map(p => <ProjectCard key={p.id} project={p} />)}</div>
}
```

## Modal Pattern
```tsx
'use client'
import { useState } from 'react'

export function ConfirmDialog({ 
  onConfirm, 
  trigger,
  title = 'Are you sure?' 
}: {
  onConfirm: () => Promise<void>
  trigger: React.ReactNode
  title?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3>{title}</h3>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setOpen(false)}>Cancel</button>
              <button 
                onClick={async () => {
                  setLoading(true)
                  await onConfirm()
                  setOpen(false)
                  setLoading(false)
                }}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

## Toast Notification Pattern
```tsx
'use client'
import { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: string; message: string; type: 'success' | 'error' }

const ToastContext = createContext<{
  toast: (message: string, type?: 'success' | 'error') => void
}>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded shadow ${
            t.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
```

## Rules
- Server Components for data fetching — Client Components for interactivity
- Use Suspense + loading.tsx for streaming
- Use useActionState for form handling (not manual useState)
- Use useOptimistic for instant feedback
- Never useEffect for data fetching — use server components
- Keep client components small — push logic to server
