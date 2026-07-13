import csv

from django.http import StreamingHttpResponse


class Echo:
    def write(self, value):
        return value


def to_csv_response(data, filename):
    writer = csv.writer(Echo())
    headers = list(data[0].keys()) if data else []

    def stream():
        yield "\ufeff"
        if headers:
            yield writer.writerow(headers)
        for row in data:
            yield writer.writerow(row.values())

    response = StreamingHttpResponse(
        streaming_content=stream(),
        content_type="text/csv; charset=utf-8",
    )
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
