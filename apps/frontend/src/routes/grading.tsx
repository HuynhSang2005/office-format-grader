import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/grading')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/grading"!</div>
}
