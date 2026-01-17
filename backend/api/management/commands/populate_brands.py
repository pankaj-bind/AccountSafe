from django.core.management.base import BaseCommand
from api.models import CuratedOrganization


class Command(BaseCommand):
    help = 'Populate CuratedOrganization with popular brands'

    def handle(self, *args, **kwargs):
        organizations = [
            # Tech Giants
            {'name': 'Google', 'domain': 'google.com', 'priority': 100, 'logo_url': 'https://cdn.brandfetch.io/google.com/w/256/h/256'},
            {'name': 'Gmail', 'domain': 'gmail.com', 'priority': 95, 'logo_url': 'https://cdn.brandfetch.io/gmail.com/w/256/h/256'},
            {'name': 'Microsoft', 'domain': 'microsoft.com', 'priority': 90, 'logo_url': 'https://cdn.brandfetch.io/microsoft.com/w/256/h/256'},
            {'name': 'Apple', 'domain': 'apple.com', 'priority': 90, 'logo_url': 'https://cdn.brandfetch.io/apple.com/w/256/h/256'},
            {'name': 'Amazon', 'domain': 'amazon.com', 'priority': 85, 'logo_url': 'https://cdn.brandfetch.io/amazon.com/w/256/h/256'},
            
            # Social Media
            {'name': 'Facebook', 'domain': 'facebook.com', 'priority': 80, 'logo_url': 'https://cdn.brandfetch.io/facebook.com/w/256/h/256'},
            {'name': 'Instagram', 'domain': 'instagram.com', 'priority': 80, 'logo_url': 'https://cdn.brandfetch.io/instagram.com/w/256/h/256'},
            {'name': 'Twitter', 'domain': 'twitter.com', 'priority': 75, 'logo_url': 'https://cdn.brandfetch.io/twitter.com/w/256/h/256'},
            {'name': 'LinkedIn', 'domain': 'linkedin.com', 'priority': 75, 'logo_url': 'https://cdn.brandfetch.io/linkedin.com/w/256/h/256'},
            {'name': 'Reddit', 'domain': 'reddit.com', 'priority': 70, 'logo_url': 'https://cdn.brandfetch.io/reddit.com/w/256/h/256'},
            
            # Developer Tools
            {'name': 'GitHub', 'domain': 'github.com', 'priority': 85, 'logo_url': 'https://cdn.brandfetch.io/github.com/w/256/h/256'},
            {'name': 'GitLab', 'domain': 'gitlab.com', 'priority': 70, 'logo_url': 'https://cdn.brandfetch.io/gitlab.com/w/256/h/256'},
            {'name': 'Stack Overflow', 'domain': 'stackoverflow.com', 'priority': 65, 'logo_url': 'https://cdn.brandfetch.io/stackoverflow.com/w/256/h/256'},
            
            # Education
            {'name': 'GeeksforGeeks', 'domain': 'geeksforgeeks.org', 'priority': 75, 'logo_url': 'https://media.geeksforgeeks.org/wp-content/uploads/20210224040124/JSBinCollaborativeJavaScriptDebugging6-300x297.png'},
            {'name': 'Coursera', 'domain': 'coursera.org', 'priority': 70, 'logo_url': 'https://cdn.brandfetch.io/coursera.org/w/256/h/256'},
            {'name': 'Udemy', 'domain': 'udemy.com', 'priority': 70, 'logo_url': 'https://cdn.brandfetch.io/udemy.com/w/256/h/256'},
            
            # Productivity
            {'name': 'Notion', 'domain': 'notion.so', 'priority': 75, 'logo_url': 'https://cdn.brandfetch.io/notion.so/w/256/h/256'},
            {'name': 'Slack', 'domain': 'slack.com', 'priority': 75, 'logo_url': 'https://cdn.brandfetch.io/slack.com/w/256/h/256'},
            {'name': 'Discord', 'domain': 'discord.com', 'priority': 75, 'logo_url': 'https://cdn.brandfetch.io/discord.com/w/256/h/256'},
            {'name': 'Zoom', 'domain': 'zoom.us', 'priority': 70, 'logo_url': 'https://cdn.brandfetch.io/zoom.us/w/256/h/256'},
            
            # Entertainment
            {'name': 'Netflix', 'domain': 'netflix.com', 'priority': 80, 'logo_url': 'https://cdn.brandfetch.io/netflix.com/w/256/h/256'},
            {'name': 'Spotify', 'domain': 'spotify.com', 'priority': 80, 'logo_url': 'https://cdn.brandfetch.io/spotify.com/w/256/h/256'},
            {'name': 'YouTube', 'domain': 'youtube.com', 'priority': 85, 'logo_url': 'https://cdn.brandfetch.io/youtube.com/w/256/h/256'},
            {'name': 'Twitch', 'domain': 'twitch.tv', 'priority': 70, 'logo_url': 'https://cdn.brandfetch.io/twitch.tv/w/256/h/256'},
            
            # Cloud & Storage
            {'name': 'Dropbox', 'domain': 'dropbox.com', 'priority': 70, 'logo_url': 'https://cdn.brandfetch.io/dropbox.com/w/256/h/256'},
            {'name': 'Google Drive', 'domain': 'drive.google.com', 'priority': 75, 'logo_url': 'https://cdn.brandfetch.io/drive.google.com/w/256/h/256'},
            
            # Finance
            {'name': 'PayPal', 'domain': 'paypal.com', 'priority': 80, 'logo_url': 'https://cdn.brandfetch.io/paypal.com/w/256/h/256'},
            {'name': 'Stripe', 'domain': 'stripe.com', 'priority': 75, 'logo_url': 'https://cdn.brandfetch.io/stripe.com/w/256/h/256'},
        ]

        created_count = 0
        updated_count = 0

        for org_data in organizations:
            org, created = CuratedOrganization.objects.update_or_create(
                domain=org_data['domain'],
                defaults={
                    'name': org_data['name'],
                    'priority': org_data['priority'],
                    'logo_url': org_data['logo_url'],
                    'website_link': f"https://{org_data['domain']}",
                    'is_verified': True
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✅ Created: {org.name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'🔄 Updated: {org.name}'))

        self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully added {created_count} new organizations'))
        self.stdout.write(self.style.SUCCESS(f'🔄 Updated {updated_count} existing organizations'))
        self.stdout.write(self.style.SUCCESS(f'📊 Total curated organizations: {CuratedOrganization.objects.count()}'))
