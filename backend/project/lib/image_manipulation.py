# Usage example:
#    THUMBNAIL_SIZE = (320, 180)
#
#    filename = 'snapshot-id-2'
#    with Image.open(f'snapshot_images/{filename}.png') as im:
#        thumbnail = make_thumbnail(im, THUMBNAIL_SIZE)
#        thumbnail.save(f'{filename}--thumbail.png', 'PNG')
# -----------------------------------------------------------------------------

from PIL import Image


def make_thumbnail(image, thumbnail_size):
    thumbnail_width, thumbnail_height = thumbnail_size

    image_aspect = image.width / image.height
    thumbnail_aspect = thumbnail_width / thumbnail_height

    crop_width = image.width
    crop_height = image.height

    # image is "too tall":
    if image_aspect < thumbnail_aspect:
        crop_height = image.width / thumbnail_aspect

    # image is "too wide":
    else:
        crop_width = image.height * thumbnail_aspect

    # TODO: Does this happen?
    # Does it matter if they are very slightly off due to rounding issues?
    if (crop_width / crop_height) != thumbnail_aspect:
        print(
            '=== ASPECT RATIOS DONT MATCH ===',
            'thumb_ar:', thumbnail_aspect,
            'crop_ar:', crop_width / crop_height,
        )

    cropped_im = image.crop(get_crop_box(
        image.width,
        image.height,
        crop_width,
        crop_height,
    ))
    cropped_im.thumbnail(thumbnail_size)

    return cropped_im


def get_crop_box(width, height, cropped_width, cropped_height):
    assert width >= cropped_width, f'invalid widths: {width}, {cropped_width}'
    assert height >= cropped_height, f'invalid height: {height}, {cropped_height}'

    vert_margin = height - cropped_height 
    horiz_margin = width - cropped_width

    left = horiz_margin / 2
    right = left + cropped_width

    upper = vert_margin / 2
    lower = upper + cropped_height

    return (left, upper, right, lower)
