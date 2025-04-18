"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive" | "success" | "warning" | "info"
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

// Map our variant types to Sonner's types
const variantToSonnerType: Record<string, string> = {
  default: "normal",
  destructive: "error",
  success: "success",
  warning: "warning",
  info: "info",
}

function toast({ ...props }: Toast) {
  const id = genId()

  // Create the toast in our state management
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  // Map our variant to Sonner's type
  const type = props.variant ? variantToSonnerType[props.variant] : "normal"

  // Create the toast in Sonner
  if (type === "normal") {
    sonnerToast(props.title as string, {
      id,
      description: props.description as string,
      duration: TOAST_REMOVE_DELAY,
      action: props.action
        ? {
            label: (props.action as any)?.altText || "Action",
            onClick: (props.action as any)?.onClick,
          }
        : undefined,
    })
  } else {
    sonnerToast[type as "success" | "error" | "warning" | "info"](props.title as string, {
      id,
      description: props.description as string,
      duration: TOAST_REMOVE_DELAY,
      action: props.action
        ? {
            label: (props.action as any)?.altText || "Action",
            onClick: (props.action as any)?.onClick,
          }
        : undefined,
    })
  }

  const update = (props: ToasterToast) => {
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })

    // Update the Sonner toast
    const type = props.variant ? variantToSonnerType[props.variant] : "normal"

    if (type === "normal") {
      sonnerToast(props.title as string, {
        id,
        description: props.description as string,
      })
    } else {
      sonnerToast[type as "success" | "error" | "warning" | "info"](props.title as string, {
        id,
        description: props.description as string,
      })
    }
  }

  const dismiss = () => {
    dispatch({ type: "DISMISS_TOAST", toastId: id })
    sonnerToast.dismiss(id)
  }

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      dispatch({ type: "DISMISS_TOAST", toastId })
      if (toastId) {
        sonnerToast.dismiss(toastId)
      } else {
        sonnerToast.dismiss()
      }
    },
  }
}

export { useToast, toast }
