// MetadataViews standard for NFT metadata
// Simplified version for testing
import "ViewResolver"

access(all) contract MetadataViews {

    access(all) struct Display {
        access(all) let name: String
        access(all) let description: String
        access(all) let thumbnail: String

        init(name: String, description: String, thumbnail: String) {
            self.name = name
            self.description = description
            self.thumbnail = thumbnail
        }
    }

    access(all) struct Royalties {
        access(all) let cutInfos: [Royalty]

        init(cutInfos: [Royalty]) {
            self.cutInfos = cutInfos
        }
    }

    access(all) struct Royalty {
        access(all) let receiver: Address
        access(all) let cut: UFix64
        access(all) let description: String

        init(receiver: Address, cut: UFix64, description: String) {
            self.receiver = receiver
            self.cut = cut
            self.description = description
        }
    }

    access(all) fun getDisplay(_ viewResolver: &{ViewResolver.Resolver}): Display? {
        if let view = viewResolver.resolveView(Type<Display>()) {
            if let display = view as? Display {
                return display
            }
        }
        return nil
    }
}