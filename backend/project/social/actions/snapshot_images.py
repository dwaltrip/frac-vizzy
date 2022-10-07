from urllib.request import urlopen

from base.settings import MEDIA_ROOT

def snapshot_to_filename(snapshot):
    return f'snapshot-id-{snapshot.id}.png'

# TODO: Save several standard sizes for different uses on the frontend.
# TODO: Add more error handling...
# Inspired by:
#   https://stackoverflow.com/a/58633199
#   https://stackoverflow.com/a/60740879
def save_snapshot_image_to_filesystem(snapshot, image_data):
    image_filename = snapshot_to_filename(snapshot)

    # TODO: Is there a Django function that does this logic?
    local_filepath = MEDIA_ROOT / image_filename

    with urlopen(image_data) as response:
      cleaned_data = response.read()

    with open(local_filepath, 'wb') as file_handler:
      file_handler.write(cleaned_data)

    return image_filename
