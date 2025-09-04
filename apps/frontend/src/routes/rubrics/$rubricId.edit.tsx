import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rubrics/$rubricId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/rubrics/$rubricId/edit"!</div>
}
