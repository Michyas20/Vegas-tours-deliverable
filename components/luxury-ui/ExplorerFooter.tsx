export default function ExplorerFooter() {
  return (
    <footer className="vh-footer">
      <div className="vh-footer-grid">
        <div className="vh-foot-col">
          <span
            style={{
              color: '#F7C948',
              fontWeight: 800,
              fontSize: '1.5rem',
              fontFamily: 'var(--font-syne)',
            }}
          >
            Vegas Horizon
          </span>
          <p style={{ marginTop: '1rem' }}>
            Award-winning small group tour agency whisking you away from the
            hustle of Las Vegas for an adventurous expedition.
          </p>
        </div>
        <div className="vh-foot-col">
          <h4>Information</h4>
          <a href="#!">Privacy Policy</a>
          <a href="#!">Terms &amp; Conditions</a>
          <a href="#!">FAQ</a>
        </div>
        <div className="vh-foot-col">
          <h4>Contact Info</h4>
          <p>1-888-555-0199</p>
          <p>hello@vegashorizon.com</p>
          <p>8 AM - 5 PM PST</p>
        </div>
      </div>
      <div className="vh-foot-bottom">
        <p>© {new Date().getFullYear()} Vegas Horizon Tours. All rights reserved.</p>
      </div>
    </footer>
  );
}
