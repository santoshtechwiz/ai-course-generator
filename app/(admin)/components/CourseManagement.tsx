'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Spinner from "@/components/Spinner"


type Course = {
  id: number
  name: string
  description: string
  image: string
  isPublic: boolean
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [newCourse, setNewCourse] = useState<Partial<Course>>({})
  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/admin/courses")
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/signin')
            return
          }
          throw new Error('Failed to fetch courses')
        }
        const data = await response.json()
        setCourses(data)
      } catch (error) {
        console.error("Failed to fetch courses:", error)
        setError('Failed to load courses. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [router])

  const handleAddCourse = async () => {
    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      })
      if (!response.ok) {
        throw new Error('Failed to add course')
      }
      const addedCourse = await response.json()
      setCourses((prevCourses) => [...prevCourses, addedCourse])
      setNewCourse({})
      setIsAddingCourse(false)
    } catch (error) {
      console.error("Failed to add course:", error)
      setError('Failed to add course. Please try again.')
    }
  }

  const handleDeleteCourse = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" })
      if (!response.ok) {
        throw new Error('Failed to delete course')
      }
      setCourses((prevCourses) => prevCourses.filter((course) => course.id !== id))
    } catch (error) {
      console.error("Failed to delete course:", error)
      setError('Failed to delete course. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner  />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Courses</h2>
        <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
          <DialogTrigger asChild>
            <Button>Add Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newCourse.name || ""}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newCourse.description || ""}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="image"
                  value={newCourse.image || ""}
                  onChange={(e) => setNewCourse({ ...newCourse, image: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleAddCourse}>Add Course</Button>
          </DialogContent>
        </Dialog>
      </div>
      {courses.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Public</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{course.name}</TableCell>
                <TableCell>{course.description}</TableCell>
                <TableCell>{course.isPublic ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Button variant="destructive" onClick={() => handleDeleteCourse(course.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center mt-4">No courses available.</p>
      )}
    </div>
  )
}

