import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

test('add field does not crash', async () => {
  render(<App />)
  // Both desktop and mobile layouts render; click the first Add Field
  fireEvent.click(screen.getAllByText('Add Field')[0])
  expect(screen.getAllByText('Untitled field')[0]).toBeInTheDocument()
})

test('PreviewForm renders when schema has fields', async () => {
  render(<App />)
  fireEvent.click(screen.getAllByText('Add Field')[0])
  // Live Preview should show the form
  expect(screen.getAllByRole('button', { name: /submit/i })[0]).toBeInTheDocument()
})
