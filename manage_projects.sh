#!/bin/bash
# Resume Project Management Helper Script

BASE_URL="http://localhost:5000/api"

function list_projects() {
    echo "📋 Listing all projects..."
    curl -s "$BASE_URL/projects" | python3 -m json.tool
}

function create_project() {
    local name=$1
    local display_name=$2
    local description=$3
    local template=${4:-"default"}

    echo "✨ Creating project '$name'..."
    curl -s -X POST "$BASE_URL/projects" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$name\", \"displayName\": \"$display_name\", \"description\": \"$description\", \"template\": \"$template\"}" \
        | python3 -m json.tool
}

function switch_project() {
    local project=$1
    echo "🔄 Switching to project '$project'..."
    curl -s -X PUT "$BASE_URL/projects/current" \
        -H "Content-Type: application/json" \
        -d "{\"project\": \"$project\"}" \
        | python3 -m json.tool
}

function duplicate_project() {
    local source=$1
    local new_name=$2
    local new_display=$3

    echo "📋 Duplicating project '$source' to '$new_name'..."
    curl -s -X POST "$BASE_URL/projects/$source/duplicate" \
        -H "Content-Type: application/json" \
        -d "{\"newName\": \"$new_name\", \"newDisplayName\": \"$new_display\"}" \
        | python3 -m json.tool
}

function delete_project() {
    local project=$1
    echo "🗑️  Deleting project '$project'..."
    curl -s -X DELETE "$BASE_URL/projects/$project" | python3 -m json.tool
}

function show_status() {
    echo "📊 Current status..."
    curl -s "$BASE_URL/status" | python3 -m json.tool
}

function show_help() {
    cat << EOF
Resume Project Management Helper

Usage:
    $0 list                                     - List all projects
    $0 create <name> <display> [desc] [tmpl]   - Create new project
    $0 switch <name>                            - Switch to project
    $0 duplicate <source> <new> <display>      - Duplicate project
    $0 delete <name>                            - Delete project
    $0 status                                   - Show current status
    $0 help                                     - Show this help

Examples:
    $0 list
    $0 create faang "FAANG Resume" "For big tech" default
    $0 switch faang
    $0 duplicate default backup "Backup Resume"
    $0 delete tech-resume
    $0 status
EOF
}

case "$1" in
    list)
        list_projects
        ;;
    create)
        create_project "$2" "$3" "${4:-}" "${5:-default}"
        ;;
    switch)
        switch_project "$2"
        ;;
    duplicate)
        duplicate_project "$2" "$3" "$4"
        ;;
    delete)
        delete_project "$2"
        ;;
    status)
        show_status
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
