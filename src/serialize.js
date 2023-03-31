// extracted from `node_modules/@wordpress/blocks/src/api/serializer.js`

/**
 * Returns the content of a block, including comment delimiters.
 *
 * @param {string} rawBlockName Block name.
 * @param {Object} attributes   Block attributes.
 * @param {string} content      Block save content.
 *
 * @return {string} Comment-delimited block content.
 */
export function getCommentDelimitedContent(
    rawBlockName,
    attributes,
    content
) {
    const serializedAttributes =
        attributes && Object.entries(attributes).length
            ? serializeAttributes(attributes) + ' '
            : '';

    // Strip core blocks of their namespace prefix.
    const blockName = rawBlockName?.startsWith('core/')
        ? rawBlockName.slice(5)
        : rawBlockName;

    // @todo make the `wp:` prefix potentially configurable.

    if (!content) {
        return `<!-- wp:${blockName} ${serializedAttributes}/-->`;
    }

    return (
        `<!-- wp:${blockName} ${serializedAttributes}-->\n` +
        content +
        `\n<!-- /wp:${blockName} -->`
    );
}

/**
 * Given an attributes object, returns a string in the serialized attributes
 * format prepared for post content.
 *
 * @param {Object} attributes Attributes object.
 *
 * @return {string} Serialized attributes.
 */
export function serializeAttributes(attributes) {
    return (
        JSON.stringify(attributes)
            // Don't break HTML comments.
            .replace(/--/g, '\\u002d\\u002d')

            // Don't break non-standard-compliant tools.
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026')

            // Bypass server stripslashes behavior which would unescape stringify's
            // escaping of quotation mark.
            //
            // See: https://developer.wordpress.org/reference/functions/wp_kses_stripslashes/
            .replace(/\\"/g, '\\u0022')
    );
}

// extracted from `node_modules/@wordpress/blocks/src/api/parser/serialize-raw-block.js`

/**
 * @typedef {Object}   Options                   Serialization options.
 * @property {boolean} [isCommentDelimited=true] Whether to output HTML comments around blocks.
 */

/** @typedef {import("./").WPRawBlock} WPRawBlock */

/**
 * Serializes a block node into the native HTML-comment-powered block format.
 * CAVEAT: This function is intended for re-serializing blocks as parsed by
 * valid parsers and skips any validation steps. This is NOT a generic
 * serialization function for in-memory blocks. For most purposes, see the
 * following functions available in the `@wordpress/blocks` package:
 *
 * @see serializeBlock
 * @see serialize
 *
 * For more on the format of block nodes as returned by valid parsers:
 *
 * @see `@wordpress/block-serialization-default-parser` package
 * @see `@wordpress/block-serialization-spec-parser` package
 *
 * @param {WPRawBlock} rawBlock     A block node as returned by a valid parser.
 * @param {Options}    [options={}] Serialization options.
 *
 * @return {string} An HTML string representing a block.
 */
export function serializeRawBlock(rawBlock, options = {}) {
    const { isCommentDelimited = true } = options;
    const {
        blockName,
        attrs = {},
        innerBlocks = [],
        innerContent = [],
    } = rawBlock;

    let childIndex = 0;
    const content = innerContent
        .map((item) =>
            // `null` denotes a nested block, otherwise we have an HTML fragment.
            item !== null
                ? item
                : serializeRawBlock(innerBlocks[childIndex++], options)
        )
        .join('\n')
        .replace(/\n+/g, '\n')
        .trim();

    return isCommentDelimited
        ? getCommentDelimitedContent(blockName, attrs, content)
        : content;
}


// modified to use `serializeRawBlock`

/**
 * Takes a block or set of blocks and returns the serialized post content.
 *
 * @param {Array}                       blocks  Block(s) to serialize.
 * @param {WPBlockSerializationOptions} options Serialization options.
 *
 * @return {string} The post content.
 */
export default function serialize(blocks, options) {
    const blocksArray = Array.isArray(blocks) ? blocks : [blocks];
    return blocksArray
        .map((block) => serializeRawBlock(block, options))
        .join('\n\n');
}