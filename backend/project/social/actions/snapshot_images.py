from urllib.request import urlopen
from PIL import Image

from base.settings import MEDIA_ROOT
from lib.image_manipulation import make_thumbnail

from social.models import Thumbnail, THUMBNAIL_SIZES


def snapshot_to_filename(snapshot):
    return f'snapshot-id-{snapshot.id}--original.png'
  
def snapshot_to_thumbnail_filename(snapshot, size):
    width, height = size
    return f'snapshot-id-{snapshot.id}--{width}x{height}.png'


# TODO: Add more error handling...
# Inspired by:
#   https://stackoverflow.com/a/58633199
#   https://stackoverflow.com/a/60740879
def create_images_for_snapshot(snapshot, image_data):
    orig_img_filename = snapshot_to_filename(snapshot)
    orig_img_filepath = MEDIA_ROOT / orig_img_filename

    with urlopen(image_data) as response:
      cleaned_data = response.read()

    with open(orig_img_filepath, 'wb') as file_handler:
      file_handler.write(cleaned_data)

    original_img = Image.open(orig_img_filepath)
    original_thumbnail = Thumbnail(
        snapshot=snapshot,
        is_original=True,
        filename=orig_img_filename,
        width=original_img.width,
        height=original_img.height,
    )
    original_thumbnail.save()

    for size in THUMBNAIL_SIZES:
        width, height = size
        thumbnail_img = make_thumbnail(original_img, size)
        filename = snapshot_to_thumbnail_filename(snapshot, size)
        thumbnail_img.save(MEDIA_ROOT / filename)

        thumbnail = Thumbnail(
            snapshot=snapshot,
            is_original=False,
            filename=filename,
            width=width,
            height=height,
        )
        thumbnail.save()
