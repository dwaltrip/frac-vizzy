
function pluralize(count, word) {
    return count === 1 ? `${count} ${word}` : `${count} ${word}s`;
}

export { pluralize };
