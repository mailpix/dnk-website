
lines_to_remove_start = 903
lines_to_remove_end = 1098

file_path = r'd:\coding\dnk\assets\css\style.css'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Adjust for 0-based indexing
# We want to keep lines before start (indices 0 to start-2)
# And lines after end (indices end to ...)
# Line 903 is index 902.
# Line 1098 is index 1097.
# So we remove indices 902 to 1097 inclusive.

start_index = lines_to_remove_start - 1
end_index = lines_to_remove_end - 1

new_lines = lines[:start_index] + lines[end_index + 1:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Removed lines {lines_to_remove_start} to {lines_to_remove_end}. New line count: {len(new_lines)}")
